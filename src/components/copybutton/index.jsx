import React from 'react';

import CopyToClipboard from 'react-copy-to-clipboard';
import Confetti from "react-dom-confetti";

const config = {
    angle: 90,
    spread: 360,
    startVelocity: 40,
    elementCount: 100,
    dragFriction: 0.12,
    duration: 3000,
    stagger: 3,
    width: "10px",
    height: "10px",
    perspective: "500px",
    colors: ["#a864fd", "#29cdff", "#78ff44", "#ff718d", "#fdff6a"],
}

const CopyButton = ({valueToCopy}) => {
    const [toolTip, setToolTip] = React.useState(false);
    const [timeout, setTimeOut] = React.useState(null);

    const onClick = () => {
        setToolTip(true);
        if (timeout) {
            clearTimeout(timeout);
        }
        setTimeOut(setTimeout(() => {
            setToolTip(false);
        }, 3000));
    }

    return (
        <div>
            <CopyToClipboard text={valueToCopy}>
                <button
                    onClick={onClick}
                    style={{
                        position: "absolute",
                        top: 0,
                        right: 0,
                        border: "none",
                        boxShadow: "none",
                        textDecoration: "none",
                        margin: "8px",
                        padding: "8px 12px",
                        background: "#E2E8F022",
                        borderRadius: "8px",
                        cursor: "pointer",
                        color: "#E2E8F0",
                        fontSize: "14px",
                        fontFamily: "sans-serif",
                        lineHeight: "1",
                    }}
                >
                    {toolTip ? "🎉 Copied!" : "Copy"}
                </button>
            </CopyToClipboard>
            <div style={{position: "absolute", top: 0, right: 0}}>
                <Confetti active={toolTip} config={config}/>
            </div>

        </div>
    );
}
export default CopyButton
