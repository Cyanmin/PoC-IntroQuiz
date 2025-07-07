import importlib
import os

HANDLER_MAP = {
    'createRoom': 'handlers.createRoom',
    'joinRoom': 'handlers.joinRoom',
    'setPlaylist': 'handlers.setPlaylist',
    'startQuiz': 'handlers.startQuiz',
    'buzz': 'handlers.buzz',
    'answer': 'handlers.answer',
    'endQuiz': 'handlers.endQuiz',
}

def handler(event, context):
    body = event.get('body')
    import json
    try:
        data = json.loads(body) if isinstance(body, str) else body
    except Exception:
        data = {}
    action = data.get('action')
    if action in HANDLER_MAP:
        module = importlib.import_module(HANDLER_MAP[action])
        return module.handler(event, context)
    return {
        "statusCode": 400,
        "body": f"Unrecognized action: {action}"
    }
