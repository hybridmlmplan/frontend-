// src/components/SessionClock.jsx
import React, { useEffect, useState } from "react";
import { getSessionInfo, formatMs } from "../utils/sessionTimer";
import { useDispatch, useSelector } from "react-redux";
import { fetchSessionStatus } from "../redux/sessionSlice";

/**
 * Shows current session index and countdown.
 * Props: poll (bool) whether to poll session status every N sec
 */
export default function SessionClock({ poll = true }) {
  const [info, setInfo] = useState(getSessionInfo());
  const dispatch = useDispatch();
  const { status } = useSelector(s => s.session || {});

  useEffect(() => {
    const t = setInterval(() => setInfo(getSessionInfo()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!poll) return;
    dispatch(fetchSessionStatus());
    const id = setInterval(() => dispatch(fetchSessionStatus()), 30_000); // refresh every 30s
    return () => clearInterval(id);
  }, [dispatch, poll]);

  const left = info?.timeLeftMs ?? 0;
  const label = info.sessionIndex ? `Session ${info.sessionIndex}` : `Next session ${info.nextSession}`;

  return (
    <div className="flex items-center gap-3 p-2 bg-white rounded shadow text-sm">
      <div>
        <div className="text-xs text-gray-500">Current</div>
        <div className="font-medium">{label}</div>
      </div>
      <div className="ml-2">
        <div className="text-xs text-gray-500">Time left</div>
        <div className="font-mono text-lg">{formatMs(left)}</div>
      </div>
      <div className="ml-4">
        <div className="text-xs text-gray-500">Pairs processed</div>
        <div className="font-medium">{status?.processedPairsCount ?? "-"}</div>
      </div>
    </div>
  );
}
