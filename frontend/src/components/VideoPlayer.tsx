import { useEffect, useRef } from 'react';

interface Props {
  videoId: string;
  onStart: (timestamp: number) => void;
}

const VideoPlayer: React.FC<Props> = ({ videoId, onStart }) => {
  const hasStartedRef = useRef(false);

  useEffect(() => {
    if (!hasStartedRef.current) {
      const ts = performance.now();
      hasStartedRef.current = true;
      onStart(ts);
    }
  }, [onStart]);

  return (
    <iframe
      width="560"
      height="315"
      src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
      title="YouTube video player"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
    />
  );
};

export default VideoPlayer;
