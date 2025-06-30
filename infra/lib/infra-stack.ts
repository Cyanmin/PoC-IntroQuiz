// lib/websocket-intro-quiz-stack.ts
import { Stack, StackProps, RemovalPolicy, Duration } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as logs from "aws-cdk-lib/aws-logs";
import * as path from "path";
import { WebSocketLambdaIntegration } from "aws-cdk-lib/aws-apigatewayv2-integrations";
import { LogGroupLogDestination, WebSocketApi, WebSocketStage } from "aws-cdk-lib/aws-apigatewayv2";
import { AccessLogFormat } from "aws-cdk-lib/aws-apigateway";

export class InfraStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // DynamoDB: Room Table
    const roomTable = new dynamodb.Table(this, "RoomTable", {
      partitionKey: { name: "roomId", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    // DynamoDB: Player Table
    const playerTable = new dynamodb.Table(this, "PlayerTable", {
      partitionKey: { name: "roomId", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "playerId", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    // CloudWatch LogGroup を作成
    const logGroup = new logs.LogGroup(this, "WebSocketAccessLogs", {
      removalPolicy: RemovalPolicy.DESTROY,
    });

    // 共通のLambda設定
    const lambdaProps = {
      runtime: lambda.Runtime.PYTHON_3_13,
      timeout: Duration.seconds(30),
      environment: {
        ROOM_TABLE: roomTable.tableName,
        PLAYER_TABLE: playerTable.tableName,
      },
    };

    // Lambda: onConnect
    const onConnect = new lambda.Function(this, "OnConnectHandler", {
      ...lambdaProps,
      code: lambda.Code.fromAsset(path.join(__dirname, "lambda")),
      handler: "onConnect.handler",
    });

    // Lambda: onDisconnect
    const onDisconnect = new lambda.Function(this, "OnDisconnectHandler", {
      ...lambdaProps,
      code: lambda.Code.fromAsset(path.join(__dirname, "lambda")),
      handler: "onDisconnect.handler",
    });

    // Lambda: onDisconnect
    const onDefault = new lambda.Function(this, "OnDefaultHandler", {
      ...lambdaProps,
      code: lambda.Code.fromAsset(path.join(__dirname, "lambda")),
      handler: "onDefault.handler",
    });

    // Lambda: buzzHandler
    const buzzHandler = new lambda.Function(this, "BuzzHandler", {
      ...lambdaProps,
      code: lambda.Code.fromAsset(path.join(__dirname, "lambda")),
      handler: "buzzHandler.handler",
    });

    // Lambda: startQuizHandler
    const startQuizHandler = new lambda.Function(this, "StartQuizHandler", {
      ...lambdaProps,
      code: lambda.Code.fromAsset(path.join(__dirname, "lambda")),
      handler: "startQuizHandler.handler",
    });

    // Lambda: joinRoomHandler
    const joinRoomHandler = new lambda.Function(this, "JoinRoomHandler", {
      ...lambdaProps,
      code: lambda.Code.fromAsset(path.join(__dirname, "lambda")),
      handler: "joinRoomHandler.handler",
    });

    // Lambda に DynamoDB のアクセス権限を付与
    [onConnect, onDisconnect, buzzHandler, startQuizHandler, joinRoomHandler].forEach((fn) => {
      roomTable.grantReadWriteData(fn);
      playerTable.grantReadWriteData(fn);
    });

    // WebSocket API 作成
    const webSocketApi = new WebSocketApi(this, "IntroQuizWebSocketApi", {
      connectRouteOptions: {
        integration: new WebSocketLambdaIntegration(
          "ConnectIntegration",
          onConnect
        ),
      },
      disconnectRouteOptions: {
        integration: new WebSocketLambdaIntegration(
          "DisconnectIntegration",
          onDisconnect
        ),
      },
      defaultRouteOptions: {
        integration: new WebSocketLambdaIntegration(
          "DefaultIntegration",
          onDefault
        ),
      },
    });

    webSocketApi.addRoute("buzz", {
      integration: new WebSocketLambdaIntegration(
        "BuzzIntegration",
        buzzHandler
      ),
    });

    webSocketApi.addRoute("startQuiz", {
      integration: new WebSocketLambdaIntegration(
        "StartQuizIntegration",
        startQuizHandler
      ),
    });

    webSocketApi.addRoute("joinRoom", {
      integration: new WebSocketLambdaIntegration(
        "JoinRoomIntegration",
        joinRoomHandler
      ),
    });

    // Stage (デフォルト: dev)
    new WebSocketStage(this, "DevStage", {
      webSocketApi,
      stageName: "dev",
      autoDeploy: true,
      accessLogSettings: {
        destination: new LogGroupLogDestination(logGroup), // ✅ bind() を持つ正しい型
        format: AccessLogFormat.custom(
          JSON.stringify({
            // ✅ AccessLogFormat に変換
            requestId: "$context.requestId",
            requestTime: "$context.requestTime",
            routeKey: "$context.routeKey",
            status: "$context.status",
            connectionId: "$context.connectionId",
            eventType: "$context.eventType",
            messageDirection: "$context.messageDirection",
            integrationErrorMessage: "$context.integrationErrorMessage",
          })
        ),
      },
    });
  }
}
