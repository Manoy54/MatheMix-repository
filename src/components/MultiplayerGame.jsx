
import React from "react";
import HostSpectatorPage from "./HostSpectatorPage.jsx";
import PlayerGamePage from "./PlayerGamePage.jsx";

export default function MultiplayerGame(props) {
    const { roomData, user } = props;
    const isHost = roomData?.hostId === user?.uid;

    if (isHost) {
        return <HostSpectatorPage {...props} />;
    }

    return <PlayerGamePage {...props} />;
}
