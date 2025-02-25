import React, {useEffect, useState} from "react";
import {fetchNoCors} from "@decky/api";

const fetchAvatarImage = async (): Promise<string | null> => {
    try {
        const res = await fetchNoCors(
            "https://deckverified.games/deck-verified/api/v1/images/plugin/decky-virtual-surround-sound/avatar.jpg",
            {method: "GET"}
        );
        if (!res.ok) {
            console.error("Failed to fetch avatar image");
            return null;
        }
        const blob = await res.blob()
        return URL.createObjectURL(blob)
    } catch (error) {
        console.error("Error fetching avatar image:", error);
        return null;
    }
};

export const Footer: React.FC = () => {
    const [avatarSrc, setAvatarSrc] = useState<string | null>(null);

    useEffect(() => {
        const loadAvatar = async () => {
            const imageUrl = await fetchAvatarImage();
            if (imageUrl) setAvatarSrc(imageUrl);
        };
        loadAvatar();

        return () => {
            if (avatarSrc) URL.revokeObjectURL(avatarSrc);
        };
    }, []);

    return (
        <div style={{
            position: "fixed",
            bottom: "0",
            left: "0",
            width: "100%",
            backgroundColor: "#0e141b",
            padding: "5px 0",
            display: "flex",
            justifyContent: "flex-end"
        }}>
            <div style={{
                display: "flex",
                alignItems: "center",
                backgroundColor: "black",
                color: "white",
                borderRadius: "15px",
                fontSize: "0.6rem",
                fontFamily: "Arial, sans-serif",
                marginRight: "5px"
            }}>
                {avatarSrc ? (
                    <img src={avatarSrc}
                         alt="Josh5 Avatar"
                         style={{
                             width: "1rem",
                             height: "1rem",
                             borderRadius: "50%",
                             marginLeft: "2px"
                         }}
                    />
                ) : (
                    <div style={{
                        width: "1rem",
                        height: "1rem",
                        borderRadius: "50%",
                        marginLeft: "2px"
                    }}></div>
                )}
                <span style={{padding: "5px"}}>This plugin was brought to you by Josh.5</span>
            </div>
        </div>
    );
};
