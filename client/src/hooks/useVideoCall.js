import { useState, useEffect, useRef, useCallback } from "react";

// Reliable public STUN servers (Free)
const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:stun3.l.google.com:19302" },
    { urls: "stun:stun4.l.google.com:19302" },
  ],
};

const useVideoCall = (socket) => {
  const [callState, setCallState] = useState("idle"); // idle, calling, ringing, connected
  const [remoteUid, setRemoteUid] = useState(null);
  const [callId, setCallId] = useState(null);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [incomingCall, setIncomingCall] = useState(null);

  const localStreamRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const callTimerRef = useRef(null);

  const createPeerConnection = useCallback(() => {
    const pc = new RTCPeerConnection(ICE_SERVERS);

    pc.onicecandidate = ({ candidate }) => {
      if (candidate && remoteUid) {
        socket?.emit("call:ice_candidate", { 
          targetUid: remoteUid, 
          candidate,
          callId: callId || pc.callId,
        });
      }
    };

    pc.ontrack = ({ streams }) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = streams[0];
      }
    };

    pc.onconnectionstatechange = () => {
      if (["disconnected", "failed", "closed"].includes(pc.connectionState)) {
        endCall();
      }
    };

    return pc;
  }, [socket, remoteUid, callId]);

  const startCall = useCallback(async (targetUid, withVideo = true, roomId = null) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: withVideo ? { width: { ideal: 1280 }, height: { ideal: 720 } } : false, 
        audio: true 
      });
      localStreamRef.current = stream;

      setRemoteUid(targetUid);
      setCallState("calling");

      // Small delay to ensure the Video component is rendered and the ref is ready
      setTimeout(() => {
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      }, 150);

      socket?.emit("call:initiate", { 
        targetUid, 
        callType: withVideo ? "video" : "audio",
        roomId 
      });
    } catch (err) {
      console.error("Start call error:", err);
      setCallState("idle");
    }
  }, [socket]);

  const handleCallAccepted = useCallback(async (data) => {
    const { callId: newCallId } = data;
    setCallId(newCallId);
    setCallState("connected");

    const pc = createPeerConnection();
    pc.callId = newCallId;
    peerConnectionRef.current = pc;

    localStreamRef.current?.getTracks().forEach((track) => {
      pc.addTrack(track, localStreamRef.current);
    });

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    socket?.emit("call:offer", {
      targetUid: remoteUid,
      offer,
      callId: newCallId
    });
  }, [socket, remoteUid, createPeerConnection]);

  const rejectCall = useCallback((from, newCallId, reason = "declined") => {
    socket?.emit("call:reject", { targetUid: from, callId: newCallId, reason });
    setIncomingCall(null);
    setCallState("idle");
  }, [socket]);

  const answerCall = useCallback(async () => {
    if (!incomingCall) return;
    const { from, callId: newCallId, callType } = incomingCall;
    const fromUid = typeof from === 'object' ? from.uid : from;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: callType === "video" ? { width: { ideal: 1280 }, height: { ideal: 720 } } : false,
        audio: true 
      });
      localStreamRef.current = stream;

      setRemoteUid(fromUid);
      setCallId(newCallId);
      setIncomingCall(null);
      setCallState("connected");

      // Small delay to ensure the Video component is rendered and the ref is ready
      setTimeout(() => {
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      }, 150);

      socket?.emit("call:accept", { targetUid: fromUid, callId: newCallId });
    } catch (err) {
      console.error("Answer call error:", err);
      rejectCall(fromUid, newCallId, "error");
    }
  }, [incomingCall, socket, rejectCall]);


  const handleOffer = useCallback(async (data) => {
    const { offer, callId: newCallId, from } = data;
    const fromUid = typeof from === 'object' ? from.uid : from;

    const pc = createPeerConnection();
    pc.callId = newCallId;
    peerConnectionRef.current = pc;

    localStreamRef.current?.getTracks().forEach((track) => {
      pc.addTrack(track, localStreamRef.current);
    });

    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    socket?.emit("call:answer", { targetUid: fromUid, answer, callId: newCallId });
  }, [createPeerConnection, socket]);


  const handleAnswer = useCallback(async (data) => {
    const { answer } = data;
    try {
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.setRemoteDescription(
          new RTCSessionDescription(answer)
        );
      }
    } catch (err) {
      console.error("Answer handling error:", err);
    }
  }, []);

  const handleIceCandidate = useCallback(async (data) => {
    const { candidate } = data;
    try {
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      }
    } catch (err) {
      console.error("ICE candidate error:", err);
    }
  }, []);

  const endCall = useCallback(() => {
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    peerConnectionRef.current?.close();
    peerConnectionRef.current = null;

    if (remoteUid && callId) {
      socket?.emit("call:end", { targetUid: remoteUid, callId, duration: callDuration });
    }
    
    if (callTimerRef.current) clearInterval(callTimerRef.current);
    
    setCallState("idle");
    setRemoteUid(null);
    setCallId(null);
    setCallDuration(0);
    setIncomingCall(null);
    setIsScreenSharing(false);
  }, [socket, remoteUid, callId, callDuration]);

  const toggleAudio = useCallback(() => {
    if (localStreamRef.current) {
      const track = localStreamRef.current.getAudioTracks()[0];
      if (track) { 
        track.enabled = !track.enabled; 
        setIsAudioMuted(!track.enabled); 
      }
    }
  }, []);

  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      const track = localStreamRef.current.getVideoTracks()[0];
      if (track) { 
        track.enabled = !track.enabled; 
        setIsVideoOff(!track.enabled); 
      }
    }
  }, []);

  const startScreenShare = useCallback(async (targetUid) => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const screenTrack = screenStream.getVideoTracks()[0];
      const sender = peerConnectionRef.current?.getSenders().find((s) => s.track?.kind === "video");
      if (sender) await sender.replaceTrack(screenTrack);
      
      socket?.emit("call:screen_start", { targetUid, callId });
      screenTrack.onended = () => stopScreenShare(targetUid);
      setIsScreenSharing(true);
    } catch (err) {
      console.error(err);
    }
  }, [socket, callId]);

  const stopScreenShare = useCallback(async (targetUid) => {
    try {
      const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
      const videoTrack = videoStream.getVideoTracks()[0];
      const sender = peerConnectionRef.current?.getSenders().find((s) => s.track?.kind === "video");
      if (sender) await sender.replaceTrack(videoTrack);
      socket?.emit("call:screen_stop", { targetUid, callId });
      setIsScreenSharing(false);
    } catch (err) {
      console.error(err);
    }
  }, [socket, callId]);

  useEffect(() => {
    if (callState === "connected") {
      callTimerRef.current = setInterval(() => setCallDuration((p) => p + 1), 1000);
    }
    return () => clearInterval(callTimerRef.current);
  }, [callState]);

  useEffect(() => {
    if (!socket) return;
    socket.on("call:incoming", (data) => {
      setIncomingCall(data);
      setCallState("ringing");
    });
    socket.on("call:accepted", handleCallAccepted);
    socket.on("call:offer", handleOffer);
    socket.on("call:answer", handleAnswer);
    socket.on("call:ice_candidate", handleIceCandidate);
    socket.on("call:rejected", () => {
      setCallState("idle");
      setRemoteUid(null);
    });
    socket.on("call:ended", endCall);

    return () => {
      socket.off("call:incoming");
      socket.off("call:accepted");
      socket.off("call:offer");
      socket.off("call:answer");
      socket.off("call:ice_candidate");
      socket.off("call:rejected");
      socket.off("call:ended");
    };
  }, [socket, handleCallAccepted, handleOffer, handleAnswer, handleIceCandidate, endCall]);

  return {
    callState, remoteUid, callId, isAudioMuted, isVideoOff, isScreenSharing,
    callDuration, incomingCall, localVideoRef, remoteVideoRef,
    startCall, answerCall, endCall, rejectCall, toggleAudio, toggleVideo,
    startScreenShare, stopScreenShare,
  };
};

export default useVideoCall;
