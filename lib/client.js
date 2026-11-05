window.__ModuleLoader__.load({
	id: "dsh-client-pixel-dancer",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });

		const React = require("react");

		//#region art constants
		/** Sprite grid: one unit below is one logical pixel of the dancer. */
		const W = 40;
		const H = 46;
		/** CSS pixels per sprite pixel. */
		const PIXEL = 3;

		const HAIR = "#f775b3";
		const HAIR_MID = "#e2569b";
		const HAIR_DARK = "#a83370";
		const HAIR_LIGHT = "#ffb4d8";
		const SKIN = "#ffd9c2";
		const SKIN_SHADE = "#efb69c";
		const EYE = "#33203a";
		const BLUSH = "#ffb6c9";
		const MOUTH = "#c2456c";
		const HOODIE = "#6fe3d4";
		const HOODIE_SHADE = "#3cbcae";
		const HOODIE_LIGHT = "#b9f7ee";
		const SKIRT = "#8f74ff";
		const SKIRT_SHADE = "#6a4fe0";
		const SOCK = "#fdfdff";
		const SOCK_SHADE = "#d9d4e8";
		const SHOE = "#6fe3d4";
		const SOLE = "#ffffff";
		//#endregion

		//#region pixel painter
		/**
		 * Fill a sprite-pixel rectangle. Coordinates are rounded to the grid so
		 * animated values still land on whole pixels and never blur the sprite.
		 */
		function rect(g, x, y, w, h, color) {
			if (w <= 0 || h <= 0) return;
			g.fillStyle = color;
			g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
		}

		/** One sprite pixel. */
		function dot(g, x, y, color) {
			rect(g, x, y, 1, 1, color);
		}

		/** A chunky limb: overlapping square blocks stepped along a line. */
		function limb(g, x0, y0, x1, y1, size, color) {
			const dx = x1 - x0;
			const dy = y1 - y0;
			const steps = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) * 2));
			g.fillStyle = color;
			for (let i = 0; i <= steps; i += 1) {
				const p = i / steps;
				g.fillRect(Math.round(x0 + dx * p), Math.round(y0 + dy * p), size, size);
			}
		}

		/** A four-point twinkle. */
		function twinkle(g, x, y, arm, color) {
			const cx = Math.round(x);
			const cy = Math.round(y);
			g.fillStyle = color;
			g.fillRect(cx - arm, cy, arm * 2 + 1, 1);
			g.fillRect(cx, cy - arm, 1, arm * 2 + 1);
		}

		/** A little eighth note drifting upward. */
		function note(g, x, y, color) {
			const cx = Math.round(x);
			const cy = Math.round(y);
			g.fillStyle = color;
			g.fillRect(cx, cy, 2, 2);
			g.fillRect(cx + 2, cy - 4, 1, 5);
			g.fillRect(cx + 2, cy - 4, 2, 1);
		}

		/** Linear interpolation. */
		function mix(a, b, p) {
			return a + (b - a) * p;
		}
		//#endregion

		//#region scene
		/**
		 * Paint one animation frame into a context whose transform maps one unit to
		 * one sprite pixel.
		 * @param g - 2D context.
		 * @param timeSec - animation clock in seconds.
		 */
		function drawScene(g, timeSec) {
			const t = timeSec;
			g.clearRect(0, 0, W, H);

			const cx = 20;
			/* One beat is half a second (120 bpm); the body rises between beats. */
			const beat = ((t % 0.5) + 0.5) % 0.5;
			const bob = -1.4 * Math.abs(Math.sin((beat / 0.5) * Math.PI));
			/* One full left-right sway per second, so it lands on every other beat. */
			const sway = Math.sin(t * Math.PI * 2) * 1.4;
			/* Arms trade places once per second. */
			const armMix = (Math.sin(t * Math.PI * 2 - Math.PI / 2) + 1) / 2;

			const headX = cx + sway * 0.55;
			const headY = 3.5 + bob;
			const bodyX = cx + sway * 0.3;
			const topY = 15.5 + bob;
			const hipY = topY + 7;

			// Soft stage light behind her.
			const glow = g.createRadialGradient(cx, 26, 1, cx, 26, 24);
			glow.addColorStop(0, "rgba(255,116,182,0.15)");
			glow.addColorStop(0.55, "rgba(255,116,182,0.05)");
			glow.addColorStop(1, "rgba(255,116,182,0)");
			g.fillStyle = glow;
			g.beginPath();
			g.arc(cx, 26, 24, 0, Math.PI * 2);
			g.fill();

			// Contact shadow, shrinking as she hops.
			g.fillStyle = "rgba(26,12,34,0.06)";
			g.beginPath();
			g.ellipse(cx, 39.8, 8.5 + bob * 0.6, 2.0, 0, 0, Math.PI * 2);
			g.fill();
			g.beginPath();
			g.ellipse(cx, 39.8, 6.2 + bob * 0.5, 1.4, 0, 0, Math.PI * 2);
			g.fill();

			// Twin tails behind the head, each swinging a half-beat late.
			paintTail(g, headX - 7.5, headY + 4, -1, t, 0);
			paintTail(g, headX + 7.5, headY + 4, 1, t, Math.PI * 0.7);

			// Legs and shoes.
			const step = Math.sin(t * Math.PI * 2);
			const liftL = Math.max(0, step) * 2;
			const liftR = Math.max(0, -step) * 2;
			paintLeg(g, cx - 2.5, hipY + 1, cx - 4.5 + sway * 0.2, 38 - liftL, -1);
			paintLeg(g, cx + 2.5, hipY + 1, cx + 4.5 + sway * 0.2, 38 - liftR, 1);

			// Hoodie body.
			rect(g, bodyX - 4, topY, 8, 1, HOODIE_LIGHT);
			rect(g, bodyX - 5, topY + 1, 10, 7, HOODIE);
			rect(g, bodyX - 4, topY + 1, 1, 2, HOODIE_SHADE);
			rect(g, bodyX + 3, topY + 1, 1, 2, HOODIE_SHADE);
			rect(g, bodyX - 3, topY + 1, 6, 1, HOODIE_SHADE);
			rect(g, bodyX - 4, topY + 7, 8, 1, HOODIE_SHADE);
			dot(g, bodyX - 2, topY + 2, "#ffffff");
			dot(g, bodyX + 1, topY + 2, "#ffffff");
			rect(g, bodyX - 3, topY + 5, 6, 1, HOODIE_SHADE);
			rect(g, bodyX + 2, topY + 3, 2, 2, "#ff86c1");

			// A-line skirt over the hips.
			for (let i = 0; i < 5; i += 1) {
				const w = 10 + i * 1.5;
				const x = cx - w / 2 + (sway * 0.55 * i) / 4;
				rect(g, x, hipY + i, w, 1, i === 0 || i === 4 ? SKIRT_SHADE : SKIRT);
			}
			rect(g, cx - 4, hipY + 2, 1, 2, SKIRT_SHADE);
			rect(g, cx + 1, hipY + 2, 1, 2, SKIRT_SHADE);

			// Arms swing between "hand up" and "hand down" on each side.
			const handL = {
				x: mix(cx - 8, cx - 9.5, armMix),
				y: mix(topY + 9, headY + 2, armMix) + bob * 0.4,
			};
			const handR = {
				x: mix(cx + 8, cx + 9.5, 1 - armMix),
				y: mix(topY + 9, headY + 2, 1 - armMix) + bob * 0.4,
			};
			paintArm(g, bodyX - 4.5, topY + 1.5, handL, -1);
			paintArm(g, bodyX + 4.5, topY + 1.5, handR, 1);

			// Head last so the face stays readable over arms and body.
			paintHead(g, headX, headY);

			// Twinkles in the air around her.
			for (let i = 0; i < 4; i += 1) {
				const angle = t * 1.7 + (i * Math.PI) / 2;
				const radius = 14.5 + Math.sin(t * 3 + i) * 2;
				const x = cx + Math.cos(angle) * radius * 1.18;
				const y = 24 + Math.sin(angle) * radius * 0.72;
				/* Keep the twinkles off her face and torso. */
				if (x > 9 && x < 31 && y > 1 && y < 34) continue;
				const alpha = 0.3 + 0.55 * (0.5 + 0.5 * Math.sin(t * 5 + i * 1.9));
				twinkle(g, x, y, i % 2 === 0 ? 2 : 1, `rgba(245,197,66,${alpha.toFixed(3)})`);
			}

			// Music notes floating up on the right.
			for (let i = 0; i < 2; i += 1) {
				const cycle = 3.4;
				const p = ((t + i * 1.7) % cycle) / cycle;
				const x = cx + 13.5 + i * 2 + Math.sin(p * Math.PI * 2) * 1.2;
				const y = 30 - p * 33;
				const alpha = Math.sin(p * Math.PI) * 0.6;
				note(g, x, y, `rgba(143,116,255,${alpha.toFixed(3)})`);
			}
		}

		function paintTail(g, x, y, dir, t, phase) {
			for (let i = 0; i < 9; i += 1) {
				const wave = Math.sin(t * Math.PI * 2 + phase + i * 0.4) * (0.25 + i * 0.15);
				const wide = i < 6 ? 3 : 2;
				const px = x + dir * i * 0.3 + wave - wide / 2 + (dir < 0 ? -0.5 : 0.5);
				const py = y + i * 1.35;
				rect(g, px, py, wide, 2, i < 6 ? HAIR : HAIR_MID);
				if (i === 8) {
					rect(g, px, py + 1, 2, 1, HAIR_DARK);
					rect(g, px + (dir < 0 ? -1 : 0), py, 1, 2, HAIR_DARK);
				}
			}
		}

		function paintLeg(g, hipX, hipY, footX, footY, side) {
			const kneeX = (hipX + footX) / 2 + side * 0.9;
			const kneeY = (hipY + footY) / 2;
			limb(g, hipX, hipY, kneeX, kneeY, 3, SKIN);
			limb(g, kneeX, kneeY, footX, footY - 2, 3, SKIN);
			rect(g, footX - 1, footY - 6, 3, 4, SOCK);
			rect(g, footX - 1, footY - 6, 3, 1, SOCK_SHADE);
			rect(g, footX - 1, footY - 5, 3, 1, "#ffc2dd");
			rect(g, footX - 2, footY - 2, 5, 2, SHOE);
			rect(g, footX - 2, footY, 5, 1, SOLE);
			rect(g, footX + 2, footY - 2, 1, 2, "#3cbcae");
		}

		function paintArm(g, shoulderX, shoulderY, hand, side) {
			const elbowX = (shoulderX + hand.x) / 2 + side * 2.2;
			const elbowY = (shoulderY + hand.y) / 2 + 1.2;
			limb(g, shoulderX, shoulderY, elbowX, elbowY, 2, HOODIE_SHADE);
			limb(g, elbowX, elbowY, hand.x, hand.y, 2, HOODIE_SHADE);
			rect(g, hand.x - 1, hand.y - 1, 3, 3, SKIN);
			rect(g, hand.x - 1, hand.y + 2, 3, 1, SKIN_SHADE);
		}

		function paintHead(g, x, y) {
			// Dark silhouette, then hair, so the outline is a clean single pixel.
			rect(g, x - 6, y, 12, 2, HAIR_DARK);
			rect(g, x - 7, y + 2, 14, 8, HAIR_DARK);
			rect(g, x - 6, y + 10, 12, 2, HAIR_DARK);
			rect(g, x - 5, y + 1, 10, 10, HAIR);
			rect(g, x - 7, y + 4, 2, 5, HAIR);
			rect(g, x + 5, y + 4, 2, 5, HAIR);
			rect(g, x - 6, y + 3, 1, 4, HAIR);
			rect(g, x + 5, y + 3, 1, 4, HAIR);

			// Face and chin.
			rect(g, x - 4, y + 4, 8, 7, SKIN);
			rect(g, x - 3, y + 11, 6, 1, SKIN);
			dot(g, x - 4, y + 10, SKIN_SHADE);
			dot(g, x + 3, y + 10, SKIN_SHADE);
			dot(g, x - 1, y + 12, SKIN_SHADE);
			dot(g, x, y + 12, SKIN_SHADE);

			// Parted fringe.
			rect(g, x - 4, y + 3, 8, 2, HAIR);
			rect(g, x - 4, y + 5, 1, 2, HAIR);
			rect(g, x + 3, y + 5, 1, 2, HAIR);
			rect(g, x - 5, y + 2, 3, 1, HAIR_LIGHT);
			rect(g, x + 2, y + 2, 2, 1, HAIR_LIGHT);

			// Face.
			rect(g, x - 3, y + 6, 2, 2, EYE);
			rect(g, x + 1, y + 6, 2, 2, EYE);
			dot(g, x - 3, y + 6, "#ffffff");
			dot(g, x + 1, y + 6, "#ffffff");
			rect(g, x - 4, y + 8, 2, 1, BLUSH);
			rect(g, x + 2, y + 8, 2, 1, BLUSH);
			dot(g, x - 2, y + 9, MOUTH);
			rect(g, x - 1, y + 10, 2, 1, MOUTH);
			dot(g, x + 1, y + 9, MOUTH);

			// Ahoge.
			dot(g, x + 2, y - 1, HAIR);
			dot(g, x + 3, y - 1, HAIR);
			dot(g, x + 3, y - 2, HAIR_LIGHT);
		}
		//#endregion

		//#region component
		/**
		 * The overlay occupant. It owns one canvas and one animation loop; being
		 * pointer-transparent it never competes with the frame's own controls.
		 */
		function PixelDancer() {
			const canvasRef = React.useRef(null);

			React.useEffect(() => {
				const canvas = canvasRef.current;
				if (!canvas) return undefined;
				const g = canvas.getContext("2d");
				if (!g) return undefined;

				const dpr = Math.min(3, Math.max(1, window.devicePixelRatio || 1));
				canvas.width = Math.round(W * PIXEL * dpr);
				canvas.height = Math.round(H * PIXEL * dpr);
				canvas.style.width = `${W * PIXEL}px`;
				canvas.style.height = `${H * PIXEL}px`;
				g.setTransform(dpr * PIXEL, 0, 0, dpr * PIXEL, 0, 0);
				g.imageSmoothingEnabled = false;

				const reduceMotion =
					typeof window.matchMedia === "function" &&
					window.matchMedia("(prefers-reduced-motion: reduce)").matches;

				if (reduceMotion) {
					drawScene(g, 0.35);
					return undefined;
				}

				let frame = 0;
				const tick = (time) => {
					drawScene(g, time / 1000);
					frame = window.requestAnimationFrame(tick);
				};
				frame = window.requestAnimationFrame(tick);
				return () => window.cancelAnimationFrame(frame);
			}, []);

			return React.createElement(
				"div",
				{
					className: "dsh-pixel-dancer",
					"aria-hidden": "true",
					style: {
						position: "fixed",
						right: "18px",
						bottom: "110px",
						width: `${W * PIXEL}px`,
						height: `${H * PIXEL}px`,
						pointerEvents: "none",
						userSelect: "none",
						zIndex: 60,
						filter: "drop-shadow(0 8px 14px rgba(20,8,30,0.28))",
					},
				},
				React.createElement("canvas", {
					ref: canvasRef,
					width: W * PIXEL,
					height: H * PIXEL,
					style: { display: "block", width: `${W * PIXEL}px`, height: `${H * PIXEL}px` },
				}),
			);
		}
		//#endregion

		//#region plugin
		/** Required service: the UI slot registry. */
		const inject = ["slots"];

		/**
		 * Mount the dancer into the frame-wide overlay list.
		 * @param ctx - client root context.
		 */
		function apply(ctx) {
			ctx.slots.inject("shell.overlay", () =>
				ctx.slots.register(
					{ name: "shell.overlay", id: "pixel-dancer", order: 100 },
					PixelDancer,
				),
			);
		}
		//#endregion

		exports.apply = apply;
		exports.inject = inject;
		exports.drawScene = drawScene;
		exports.W = W;
		exports.H = H;
		exports.PIXEL = PIXEL;
		return module.exports;
	},
});





