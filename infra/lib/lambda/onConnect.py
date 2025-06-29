def handler(event, context):
    print("Received event:", event)
    
    # 必要であれば、接続 ID をログ出力
    connection_id = event.get('requestContext', {}).get('connectionId')
    route_key = event.get('requestContext', {}).get('routeKey')
    
    print(f"Connection ID: {connection_id}, Route: {route_key}")
    
    return {
        "statusCode": 200,
        "body": "OK"
    }
