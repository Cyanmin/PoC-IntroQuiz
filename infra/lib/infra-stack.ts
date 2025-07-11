// lib/websocket-intro-quiz-stack.ts
import { Stack, StackProps, RemovalPolicy, Duration } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as logs from "aws-cdk-lib/aws-logs";
import * as iam from "aws-cdk-lib/aws-iam";
import * as path from "path";
import * as dotenv from "dotenv";
import { Fn } from "aws-cdk-lib";

import { WebSocketLambdaIntegration } from "aws-cdk-lib/aws-apigatewayv2-integrations";
import {
  LogGroupLogDestination,
  WebSocketApi,
  WebSocketStage,
} from "aws-cdk-lib/aws-apigatewayv2";
import { AccessLogFormat } from "aws-cdk-lib/aws-apigateway";
import { AssetCode, DockerImageCode } from "aws-cdk-lib/aws-lambda";
import { DockerImageAsset } from "aws-cdk-lib/aws-ecr-assets";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

export class InfraStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // DynamoDB: Room Table
    const roomTable = new dynamodb.Table(this, "RoomTable", {
      partitionKey: { name: "roomId", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY,
      // 属性定義はDynamoDBではPartition/Sort Key以外は明示不要だが、コメントで補足
      // その他属性: roomName (String), playlistId (String), videoIds (List), currentIndex (Number), state (String), createdAt (Number)
    });

    // DynamoDB: Player Table
    const playerTable = new dynamodb.Table(this, "PlayerTable", {
      partitionKey: { name: "roomId", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "playerId", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY,
      // 属性定義はDynamoDBではPartition/Sort Key以外は明示不要だが、コメントで補足
      // その他属性: playerName (String), connectionId (String), elapsed (Number), score (Number), joinedAt (Number)
    });

    // DynamoDB: Playlist Cache Table
    const playlistCacheTable = new dynamodb.Table(this, "PlaylistCacheTable", {
      partitionKey: { name: "playlistId", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY,
      timeToLiveAttribute: "expiresAt",
    });

    // GSI for connectionId lookup
    playerTable.addGlobalSecondaryIndex({
      indexName: "connectionId-index",
      partitionKey: {
        name: "connectionId",
        type: dynamodb.AttributeType.STRING,
      },
      projectionType: dynamodb.ProjectionType.ALL,
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
        PLAYLIST_CACHE_TABLE: playlistCacheTable.tableName,
        YOUTUBE_API_KEY: process.env.YOUTUBE_API_KEY ?? "",
      },
    };

    // Lambda: onConnect
    const onConnect = new lambda.Function(this, "OnConnectHandler", {
      ...lambdaProps,
      code: lambda.Code.fromAsset("lib/lambda"),
      handler: "onConnect.handler",
    });

    // Lambda: onDisconnect
    const onDisconnect = new lambda.Function(this, "OnDisconnectHandler", {
      ...lambdaProps,
      code: lambda.Code.fromAsset("lib/lambda"),
      handler: "onDisconnect.handler",
    });

    // NOTE: すべてのメッセージは $default ルートで受信し、onDefault.handler 内で action によるルーティングを行う
    // Lambda: onDefault
    const onDefault = new lambda.Function(this, "OnDefaultHandler", {
      ...lambdaProps,
      code: lambda.Code.fromAsset("lib/lambda"),
      handler: "onDefault.handler",
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

    const connectionArn = `arn:aws:execute-api:${this.region}:${this.account}:${webSocketApi.apiId}/*/*/@connections/*`;

    // Lambda に DynamoDB のアクセス権限を付与
    [onConnect, onDisconnect, onDefault].forEach((fn) => {
      roomTable.grantReadWriteData(fn);
      playerTable.grantReadWriteData(fn);
      playlistCacheTable.grantReadWriteData(fn);

      // post_to_connection のための明示的な IAM ポリシーを付与
      fn.addToRolePolicy(
        new iam.PolicyStatement({
          actions: ["execute-api:ManageConnections"],
          resources: [connectionArn],
        })
      );
    });

    const requestsLayer = new lambda.LayerVersion(this, "RequestsLayer", {
      code: lambda.Code.fromAsset(
        path.join(__dirname, "../layers/requests-layer"),
        {
          bundling: {
            image: lambda.Runtime.PYTHON_3_13.bundlingImage,
            command: [
              "bash",
              "-c",
              [
                "pip install -r python/requirements.txt -t /asset-output/python",
              ].join(" && "),
            ],
          },
        }
      ),
      compatibleRuntimes: [lambda.Runtime.PYTHON_3_13],
    });

    onDefault.addLayers(requestsLayer);

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

    const stageName = "dev";
    const httpsEndpoint = Fn.join("", [
      "https://",
      webSocketApi.apiId, // API ID
      ".execute-api.",
      this.region, // AWS::Region
      ".amazonaws.com/",
      stageName,
    ]);
    [onConnect, onDisconnect, onDefault].forEach((fn) => {
      fn.addEnvironment("WS_ENDPOINT", httpsEndpoint);
    });
  }
}
