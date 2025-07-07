import React, { useState, useEffect, useCallback } from "react";
import { useWebSocket } from "../../hooks/useWebSocket";
import { useNavigate } from "react-router-dom";
import { useRoomStore } from "../../stores/useRoomStore";
import { usePlayerStore } from "../../stores/usePlayerStore";

const RoomPage: React.FC = () => {
  const { send, messages } = useWebSocket();
  const navigate = useNavigate();
  const roomId = useRoomStore((state) => state.roomId);
  const playerId = usePlayerStore((state) => state.playerId);
  const [roomName, setRoomName] = useState("");
  const [players, setPlayers] = useState<string[]>([]);
  const [videoId, setVideoId] = useState("");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [startTimestamp, setStartTimestamp] = useState<number | null>(null);
  const [isQuizActive, setIsQuizActive] = useState(false);
  const [isBuzzAccepted, setIsBuzzAccepted] = useState(false);
  const [isBuzzing, setIsBuzzing] = useState(false);
  const [answer, setAnswer] = useState("");
  const [answerResult, setAnswerResult] = useState<{
    correct: boolean;
    title: string;
  } | null>(null);
  const [info, setInfo] = useState("");

  // メッセージ監視
  useEffect(() => {
    if (messages.length === 0) return;
    const last = messages[
      messages.length - 1
    ] as import("../../types/websocket").WSIncoming;
    switch (last.type) {
      case "joinRoomResult":
        if (last.status === "ok" && Array.isArray(last.playerList)) {
          setPlayers(last.playerList);
        }
        break;
      case "roomInfo":
        if ("roomName" in last && typeof last.roomName === "string")
          setRoomName(last.roomName);
        if ("players" in last && Array.isArray(last.players))
          setPlayers(last.players);
        break;
      case "playerListUpdate":
        if ("players" in last && Array.isArray(last.players))
          setPlayers(last.players);
        break;
      case "startQuiz":
        if ("videoId" in last && typeof last.videoId === "string")
          setVideoId(last.videoId);
        if ("questionIndex" in last && typeof last.questionIndex === "number") {
          setQuestionIndex(last.questionIndex);
        } else {
          setQuestionIndex(0);
        }
        setStartTimestamp(Date.now());
        setIsQuizActive(true);
        setIsBuzzAccepted(false);
        setIsBuzzing(false);
        setAnswer("");
        setAnswerResult(null);
        setInfo("");
        break;
      case "buzzAccepted":
        setIsBuzzAccepted(true);
        setIsBuzzing(false);
        setInfo("解答権を獲得しました！");
        break;
      case "buzzResult":
        setIsBuzzing(false);
        setIsBuzzAccepted(false);
        setInfo("他のプレイヤーが解答中です");
        break;
      case "answerResult":
        setAnswerResult({
          correct:
            "result" in last && last.result === "correct" ? true : false,
          title:
            "videoTitle" in last && typeof last.videoTitle === "string"
              ? last.videoTitle
              : "",
        });
        setIsBuzzAccepted(false);
        setInfo("");
        break;
      case "quizEnded":
        navigate("/result");
        break;
      default:
        break;
    }
  }, [messages, navigate]);

  // 早押し
  const handleBuzz = useCallback(() => {
    setIsBuzzing(true);
    const elapsed = startTimestamp ? Date.now() - startTimestamp : 0;
    send({
      action: "buzz",
      roomId,
      playerId,
      elapsed,
      questionIndex,
    });
  }, [send, startTimestamp, roomId, playerId, questionIndex]);

  // 解答送信
  const handleSendAnswer = useCallback(() => {
    if (!answer) return;
    send({
      action: "answer",
      roomId,
      playerId,
      answer,
      questionIndex,
    });
    setAnswer("");
  }, [answer, send, roomId, playerId, questionIndex]);

  return (
    <div
      style={{
        maxWidth: 600,
        margin: "2rem auto",
        padding: 24,
        border: "1px solid #ccc",
        borderRadius: 8,
      }}
    >
      <h1>ルーム: {roomName}</h1>
      <div style={{ marginBottom: 16 }}>
        <h3>プレイヤー一覧</h3>
        <ul>
          {players.map((p, i) => (
            <li key={i}>{p}</li>
          ))}
        </ul>
      </div>
      {videoId && (
        <div style={{ marginBottom: 16 }}>
          <iframe
            width="480"
            height="270"
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1&controls=0`}
            title="YouTube video player"
            frameBorder="0"
            allow="autoplay; encrypted-media"
            allowFullScreen
          />
        </div>
      )}
      {isQuizActive && !isBuzzAccepted && !isBuzzing && (
        <button
          onClick={handleBuzz}
          style={{ width: "100%", marginBottom: 16 }}
        >
          解答する
        </button>
      )}
      {isBuzzing && (
        <div style={{ color: "orange", marginBottom: 16 }}>解答権申請中...</div>
      )}
      {isBuzzAccepted && (
        <div style={{ marginBottom: 16 }}>
          <input
            type="text"
            placeholder="解答を入力"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            style={{ width: "100%", marginBottom: 8 }}
          />
          <button onClick={handleSendAnswer} style={{ width: "100%" }}>
            解答送信
          </button>
        </div>
      )}
      {answerResult && (
        <div
          style={{
            marginTop: 16,
            color: answerResult.correct ? "green" : "red",
          }}
        >
          {answerResult.correct ? "正解！" : "不正解"}
          <div>動画タイトル: {answerResult.title}</div>
        </div>
      )}
      {info && <div style={{ marginTop: 16, color: "blue" }}>{info}</div>}
    </div>
  );
};

export default RoomPage;
