
import React from "react";
import HostSpectatorPage from "./HostSpectatorPage.jsx";
import PlayerGamePage from "./PlayerGamePage.jsx";

export default function MultiplayerGame(props) {
    const { roomData, user } = props;
    const isHost = roomData?.hostId === user?.uid;

    const hostParticipates = roomData?.hostParticipates;

    // If I am the host and I am NOT participating, show Spectator Page
    // If I am the host and I AM participating, show PlayerGamePage
    if (isHost && !hostParticipates) {
        return <HostSpectatorPage {...props} />;
    }

    // Otherwise (Host Participating OR Regular Player), show PlayerGamePage
    return <PlayerGamePage {...props} isHost={isHost} />;
}
