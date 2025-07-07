def handler(event, context):
    # $connect時はDB更新せず、connectionIdのみ取得
    connection_id = event['requestContext']['connectionId']
    # ログやデバッグ用にconnectionIdを出力する場合は下記を有効化
    print(f"Connected: {connection_id}")
    return {
        "statusCode": 200,
        "body": "Connected"
    }
