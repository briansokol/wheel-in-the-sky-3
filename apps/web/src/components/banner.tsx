import { TinyColor } from '@ctrl/tinycolor';
import { Segment } from '@repo/shared/classes/segment';
import { WheelManager } from '@repo/shared/classes/wheel-manager';
import { RefObject, useEffect, useMemo } from 'react';

interface BannerProps {
    bannerRef: RefObject<HTMLCanvasElement | null>;
    wheelManager: WheelManager | undefined;
    winner: Segment | undefined;
}

const FONT_NAME = '"Quicksand", sans-serif';

/**
 * Banner component that displays the wheel title and winner in a styled canvas
 * with rounded corners and triangular indicators pointing inward
 */
export function Banner({ bannerRef, wheelManager, winner }: BannerProps) {
    const fgColor = useMemo(() => {
        return winner?.textColor ?? '#ffffff';
    }, [winner?.textColor]);

    const segmentColor = useMemo(() => {
        return winner?.backgroundColor ?? '#000000';
    }, [winner?.backgroundColor]);

    const bgColor = useMemo(() => {
        if (!winner) {
            return '#000000';
        }

        const color = new TinyColor(winner.backgroundColor);
        const brightness = color.getBrightness();
        const isLight = color.isLight();

        if (isLight) {
            if (brightness > 215) {
                return color.darken(20).toString();
            } else {
                return color.brighten(20).toString();
            }
        } else {
            if (brightness < 30) {
                return color.brighten(20).toString();
            } else {
                return color.darken(20).toString();
            }
        }
    }, [winner]);

    useEffect(() => {
        if (bannerRef.current) {
            const ctx = bannerRef.current.getContext('2d');
            if (ctx) {
                const canvas = bannerRef.current;
                const canvasWidth = canvas.width;
                const canvasHeight = canvas.height;
                const cornerRadius = 15; // Radius for rounded corners

                // Clear the canvas to start with transparency
                ctx.clearRect(0, 0, canvasWidth, canvasHeight);

                // Create a rounded rectangle path for the background
                ctx.beginPath();
                ctx.moveTo(cornerRadius, 0);
                ctx.lineTo(canvasWidth - cornerRadius, 0);
                ctx.arcTo(canvasWidth, 0, canvasWidth, cornerRadius, cornerRadius);
                ctx.lineTo(canvasWidth, canvasHeight - cornerRadius);
                ctx.arcTo(canvasWidth, canvasHeight, canvasWidth - cornerRadius, canvasHeight, cornerRadius);
                ctx.lineTo(cornerRadius, canvasHeight);
                ctx.arcTo(0, canvasHeight, 0, canvasHeight - cornerRadius, cornerRadius);
                ctx.lineTo(0, cornerRadius);
                ctx.arcTo(0, 0, cornerRadius, 0, cornerRadius);
                ctx.closePath();

                // Fill the rounded rectangle background
                ctx.fillStyle = bgColor;
                ctx.fill();

                // Draw isosceles triangles pointing toward center
                const triangleWidth = 350;
                const triangleHeight = 250;
                const verticalPosition = canvasHeight / 2 - triangleHeight / 2;

                // Left triangle (pointing right)
                ctx.beginPath();
                ctx.fillStyle = segmentColor;
                ctx.moveTo(0, verticalPosition);
                ctx.lineTo(0, verticalPosition + triangleHeight);
                ctx.lineTo(triangleWidth, verticalPosition + triangleHeight / 2);
                ctx.closePath();
                ctx.fill();

                // Right triangle (pointing left)
                ctx.beginPath();
                ctx.fillStyle = segmentColor;
                ctx.moveTo(canvasWidth, verticalPosition);
                ctx.lineTo(canvasWidth, verticalPosition + triangleHeight);
                ctx.lineTo(canvasWidth - triangleWidth, verticalPosition + triangleHeight / 2);
                ctx.closePath();
                ctx.fill();

                // Set text properties for text
                ctx.fillStyle = fgColor;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';

                // Draw "Winner!" text
                ctx.font = `28px ${FONT_NAME}`;
                ctx.fillText('Winner!', canvasWidth / 2, canvasHeight / 3);

                // Draw title text
                ctx.fillText(wheelManager?.config.fullTitle ?? '', canvasWidth / 2, (canvasHeight * 2) / 3);

                // Draw winner name
                ctx.font = `48px ${FONT_NAME}`;
                ctx.fillText(winner?.name ?? '', canvasWidth / 2, canvasHeight / 2);

                // Draw app name
                ctx.font = `16px ${FONT_NAME}`;
                ctx.fillText('wheelinthesky.app', canvasWidth / 2, canvasHeight - 25);
            }
        }
    }, [bannerRef, bgColor, fgColor, segmentColor, wheelManager, winner]);

    return (
        <canvas
            ref={bannerRef}
            width="800"
            height="300"
            style={{
                borderRadius: '15px',
            }}
        ></canvas>
    );
}
