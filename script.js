(function () {
    'use strict';
    window.requestAnimationFrame(function () {
        document.body.classList.add('page-ready');
    });

    var canvas = document.getElementById('star-canvas');
    var ctx = canvas.getContext('2d');
    var stars = [];
    var numStars = 220;
    var mouseX = window.innerWidth / 2;
    var mouseY = window.innerHeight / 2;
    var mouseDown = false;

    function initStars() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        numStars = Math.max(220, Math.min(420, Math.floor((canvas.width * canvas.height) / 5200)));
        stars = [];
        for (var i = 0; i < numStars; i++) {
            stars.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                radius: 0.8 + Math.random() * 2.8,
                vx: -0.45 + Math.random() * 0.9,
                vy: -0.2 + Math.random() * 1.3,
                alpha: 0.45 + Math.random() * 0.55
            });
        }
    }

    function drawStars() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        var nearCount = 0;
        var rageMode = document.body.classList.contains('rage-mode');
        if (quakeBurst > 0) quakeBurst *= 0.9;
        var jitterX = 0;
        var jitterY = 0;
        if (rageMode) {
            jitterX = (Math.random() - 0.5) * (2.2 + quakeBurst * 2.4);
            jitterY = (Math.random() - 0.5) * (2.2 + quakeBurst * 2.4);
            ctx.save();
            ctx.translate(jitterX, jitterY);
        }
        for (var i = 0; i < stars.length; i++) {
            var s = stars[i];
            var dx = s.x - mouseX;
            var dy = s.y - mouseY;
            var distSq = dx * dx + dy * dy;
            var dist = Math.sqrt(distSq) || 1;
            var reactRadius = mouseDown ? 280 : 230;
            if (rageMode) reactRadius += 70;
            if (distSq < reactRadius * reactRadius) {
                var nx = dx / dist;
                var ny = dy / dist;
                var force = (reactRadius - dist) / reactRadius;
                var impulse = mouseDown ? 2.1 : 1.55;
                if (rageMode) impulse += 0.95;
                s.vx += nx * force * impulse;
                s.vy += ny * force * impulse;
                if (dist < s.radius + 22) {
                    s.vx += nx * 2.4;
                    s.vy += ny * 2.4;
                }
                nearCount++;
            }

            ctx.beginPath();
            ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255,255,255,' + s.alpha + ')';
            ctx.fill();

            if (dist < 120) {
                var lineA = 1 - (dist / 120);
                ctx.beginPath();
                ctx.moveTo(s.x, s.y);
                ctx.lineTo(mouseX, mouseY);
                ctx.strokeStyle = 'rgba(255,255,255,' + (lineA * 0.22) + ')';
                ctx.lineWidth = 0.7;
                ctx.stroke();
            }

            s.vx *= 0.98;
            s.vy *= 0.985;
            if (Math.abs(s.vx) < 0.12) s.vx += (s.vx < 0 ? -0.12 : 0.12);
            if (Math.abs(s.vy) < 0.12) s.vy += (s.vy < 0 ? -0.12 : 0.12);
            if (rageMode) {
                var quakeForce = 0.45 + quakeBurst;
                s.vx += (Math.random() - 0.5) * quakeForce;
                s.vy += (Math.random() - 0.5) * quakeForce;
            }
            s.x += s.vx;
            s.y += s.vy;
            if (s.x < s.radius) {
                s.x = s.radius;
                s.vx = Math.abs(s.vx);
            }
            if (s.x > canvas.width - s.radius) {
                s.x = canvas.width - s.radius;
                s.vx = -Math.abs(s.vx);
            }
            if (s.y < s.radius) {
                s.y = s.radius;
                s.vy = Math.abs(s.vy);
            }
            if (s.y > canvas.height - s.radius) {
                s.y = canvas.height - s.radius;
                s.vy = -Math.abs(s.vy);
            }
        }
        if (rageMode) {
            ctx.restore();
            canvas.style.transform = 'translate3d(' + (-jitterX).toFixed(2) + 'px,' + (-jitterY).toFixed(2) + 'px,0)';
        } else {
            canvas.style.transform = 'translate3d(0,0,0)';
        }
        canvas.style.filter = nearCount > 0 ? 'drop-shadow(0 0 8px rgba(255,255,255,0.2))' : 'none';
        requestAnimationFrame(drawStars);
    }

    initStars();
    drawStars();
    window.addEventListener('resize', initStars);
    window.addEventListener('resize', initAmbientOrbs);

    var dot = document.getElementById('cursor-dot');
    var trail = document.getElementById('cursor-trail');
    var fxLayer = document.getElementById('fx-layer');
    var modeToast = document.getElementById('mode-toast');
    var trailX = mouseX;
    var trailY = mouseY;
    var profileCard = document.querySelector('.profile-card');
    var linkButtons = document.querySelectorAll('.link-btn');
    var audioCtx = null;
    var analyser = null;
    var audioSourceNode = null;
    var freqData = null;
    var beatValue = 0;
    var toastTimer = null;
    var modeHitTimer = null;
    var quakeBurst = 0;
    var ambientOrbs = [];

    function showModeToast(text) {
        if (!modeToast) return;
        modeToast.textContent = text;
        modeToast.classList.add('show');
        if (toastTimer) clearTimeout(toastTimer);
        toastTimer = setTimeout(function () {
            modeToast.classList.remove('show');
        }, 1200);
    }

    function spawnShockwave(x, y) {
        if (!fxLayer) return;
        var node = document.createElement('span');
        node.className = 'shockwave';
        node.style.left = x + 'px';
        node.style.top = y + 'px';
        fxLayer.appendChild(node);
        setTimeout(function () {
            node.remove();
        }, 760);
    }

    function initAmbientOrbs() {
        if (!fxLayer) return;
        for (var k = 0; k < ambientOrbs.length; k++) {
            ambientOrbs[k].node.remove();
        }
        ambientOrbs = [];
        var count = Math.max(18, Math.min(42, Math.floor((window.innerWidth * window.innerHeight) / 70000)));
        for (var i = 0; i < count; i++) {
            var orb = document.createElement('span');
            orb.className = 'ambient-orb ' + (Math.random() < 0.5 ? 'is-blue' : 'is-yellow');
            var size = 16 + Math.random() * 54;
            var x = Math.random() * window.innerWidth;
            var y = Math.random() * window.innerHeight;
            var vx = -0.45 + Math.random() * 0.9;
            var vy = -0.4 + Math.random() * 0.8;
            var opacity = 0.1 + Math.random() * 0.24;
            orb.style.setProperty('--s', size.toFixed(1) + 'px');
            orb.style.setProperty('--x', x.toFixed(1) + 'px');
            orb.style.setProperty('--y', y.toFixed(1) + 'px');
            orb.style.setProperty('--o', opacity.toFixed(3));
            fxLayer.appendChild(orb);
            ambientOrbs.push({ node: orb, x: x, y: y, vx: vx, vy: vy, size: size });
        }
    }

    function animateAmbientOrbs() {
        if (ambientOrbs.length) {
            for (var i = 0; i < ambientOrbs.length; i++) {
                var o = ambientOrbs[i];
                o.vx += (Math.random() - 0.5) * 0.015;
                o.vy += (Math.random() - 0.5) * 0.015;
                if (o.vx > 0.8) o.vx = 0.8;
                if (o.vx < -0.8) o.vx = -0.8;
                if (o.vy > 0.8) o.vy = 0.8;
                if (o.vy < -0.8) o.vy = -0.8;
                o.x += o.vx;
                o.y += o.vy;
                if (o.x < -o.size) o.x = window.innerWidth + o.size;
                if (o.x > window.innerWidth + o.size) o.x = -o.size;
                if (o.y < -o.size) o.y = window.innerHeight + o.size;
                if (o.y > window.innerHeight + o.size) o.y = -o.size;
                o.node.style.setProperty('--x', o.x.toFixed(1) + 'px');
                o.node.style.setProperty('--y', o.y.toFixed(1) + 'px');
            }
        }
        requestAnimationFrame(animateAmbientOrbs);
    }

    function triggerModeSwitchHit() {
        document.body.classList.add('mode-switch-hit');
        if (modeHitTimer) clearTimeout(modeHitTimer);
        modeHitTimer = setTimeout(function () {
            document.body.classList.remove('mode-switch-hit');
        }, 420);
    }

    window.addEventListener('mousemove', function (e) {
        mouseX = e.clientX;
        mouseY = e.clientY;
        document.body.style.setProperty('--mx', mouseX + 'px');
        document.body.style.setProperty('--my', mouseY + 'px');
        dot.style.left = mouseX + 'px';
        dot.style.top = mouseY + 'px';
    });
    window.addEventListener('mousedown', function () { mouseDown = true; });
    window.addEventListener('mouseup', function () { mouseDown = false; });
    window.addEventListener('click', function (e) {
        spawnShockwave(e.clientX, e.clientY);
    }, { passive: true });
    initAmbientOrbs();
    animateAmbientOrbs();

    if (profileCard) {
        profileCard.addEventListener('mousemove', function (e) {
            var rect = profileCard.getBoundingClientRect();
            var x = e.clientX - rect.left;
            var y = e.clientY - rect.top;
            var px = (x / rect.width) * 100;
            var py = (y / rect.height) * 100;
            var rx = ((y / rect.height) - 0.5) * -9;
            var ry = ((x / rect.width) - 0.5) * 9;
            profileCard.style.setProperty('--mx', px + '%');
            profileCard.style.setProperty('--my', py + '%');
            profileCard.style.setProperty('--rx', rx.toFixed(2) + 'deg');
            profileCard.style.setProperty('--ry', ry.toFixed(2) + 'deg');
            profileCard.classList.add('is-active');
        });

        profileCard.addEventListener('mouseleave', function () {
            profileCard.style.setProperty('--rx', '0deg');
            profileCard.style.setProperty('--ry', '0deg');
            profileCard.style.setProperty('--mx', '50%');
            profileCard.style.setProperty('--my', '50%');
            profileCard.classList.remove('is-active');
        });
    }

    for (var b = 0; b < linkButtons.length; b++) {
        (function (btn) {
            btn.addEventListener('mousemove', function (e) {
                var rect = btn.getBoundingClientRect();
                var x = e.clientX - rect.left;
                var y = e.clientY - rect.top;
                var tx = ((x / rect.width) - 0.5) * 10;
                var ty = ((y / rect.height) - 0.5) * 8;
                btn.style.setProperty('--btn-tx', tx.toFixed(2) + 'px');
                btn.style.setProperty('--btn-ty', ty.toFixed(2) + 'px');
            });
            btn.addEventListener('mouseleave', function () {
                btn.style.setProperty('--btn-tx', '0px');
                btn.style.setProperty('--btn-ty', '0px');
            });
        })(linkButtons[b]);
    }

    function animateCursor() {
        var distX = mouseX - trailX;
        var distY = mouseY - trailY;
        trailX += distX * 0.15;
        trailY += distY * 0.15;
        trail.style.left = trailX + 'px';
        trail.style.top = trailY + 'px';
        requestAnimationFrame(animateCursor);
    }
    animateCursor();

    function setupAudioReactive() {
        if (audioCtx || !audio) return;
        try {
            var Ctx = window.AudioContext || window.webkitAudioContext;
            if (!Ctx) return;
            audioCtx = new Ctx();
            analyser = audioCtx.createAnalyser();
            analyser.fftSize = 256;
            freqData = new Uint8Array(analyser.frequencyBinCount);
            audioSourceNode = audioCtx.createMediaElementSource(audio);
            audioSourceNode.connect(analyser);
            analyser.connect(audioCtx.destination);
        } catch (e) {
            console.warn('Audio reactive setup skipped:', e);
        }
    }

    function animateBeatReactive() {
        if (analyser && freqData) {
            analyser.getByteFrequencyData(freqData);
            var bass = 0;
            var bassBins = Math.min(18, freqData.length);
            for (var i = 0; i < bassBins; i++) bass += freqData[i];
            var normalized = bassBins ? (bass / bassBins) / 255 : 0;
            beatValue += (normalized - beatValue) * 0.22;
            document.body.style.setProperty('--beat', beatValue.toFixed(3));
        }
        requestAnimationFrame(animateBeatReactive);
    }
    animateBeatReactive();

    var entryScreen = document.getElementById('entry-screen');
    var mainContent = document.getElementById('main-content');
    var audio = document.getElementById('bg-music');
    var playingNotice = document.getElementById('playing-notice');
    var playingLabel = playingNotice.querySelector('.playing-label');
    var playingDetail = document.getElementById('playing-detail');
    var entered = false;
    var audioStartTime = 23;
    var shouldForceStartOnReady = true;
    var hasAppliedStartOffset = false;

    function seekAudioStart() {
        if (!audio || !isFinite(audio.duration) || audio.duration <= 0) return false;
        var target = audioStartTime < audio.duration ? audioStartTime : 0;
        audio.currentTime = target;
        return true;
    }

    function enforceAudioStartOffset() {
        if (!entered || hasAppliedStartOffset) return;
        if (!isFinite(audio.duration) || audio.duration <= 0) return;
        var target = audioStartTime < audio.duration ? audioStartTime : 0;
        if (Math.abs(audio.currentTime - target) > 0.45) {
            audio.currentTime = target;
        }
        hasAppliedStartOffset = true;
    }

    function showPlayingNotice() {
        playingNotice.hidden = false;
        requestAnimationFrame(function () {
            playingNotice.classList.add('is-visible');
        });
    }

    function setEntryParallax(e) {
        if (entered || !entryScreen) return;
        var rect = entryScreen.getBoundingClientRect();
        var x = e.clientX - rect.left;
        var y = e.clientY - rect.top;
        var ry = ((x / rect.width) - 0.5) * 8;
        var rx = ((y / rect.height) - 0.5) * -8;
        entryScreen.style.setProperty('--entry-rx', rx.toFixed(2) + 'deg');
        entryScreen.style.setProperty('--entry-ry', ry.toFixed(2) + 'deg');
    }

    function resetEntryParallax() {
        if (!entryScreen) return;
        entryScreen.style.setProperty('--entry-rx', '0deg');
        entryScreen.style.setProperty('--entry-ry', '0deg');
    }

    function showAudioLoadError() {
        playingNotice.classList.add('is-error');
        if (playingLabel) playingLabel.textContent = 'No audio';
        if (playingDetail) {
            playingDetail.textContent =
                'audio.mp3 failed to load or play. Check that the file is a valid MP3 next to index.html.';
        }
    }

    function clearAudioLoadError() {
        playingNotice.classList.remove('is-error');
        if (playingLabel) playingLabel.textContent = 'Playing';
        if (playingDetail) playingDetail.textContent = 'Lil XXEL - LMK';
    }

    audio.addEventListener('error', function () {
        if (!entered) return;
        showAudioLoadError();
    });

    audio.addEventListener('playing', function () {
        clearAudioLoadError();
        enforceAudioStartOffset();
    });

    audio.addEventListener('loadedmetadata', function () {
        if (shouldForceStartOnReady) {
            shouldForceStartOnReady = !seekAudioStart();
        }
    });

    audio.addEventListener('canplay', function () {
        if (shouldForceStartOnReady) {
            shouldForceStartOnReady = !seekAudioStart();
        }
    });

    audio.addEventListener('ended', function () {
        hasAppliedStartOffset = false;
        seekAudioStart();
        var p = audio.play();
        if (p && typeof p.catch === 'function') {
            p.catch(function () {});
        }
    });

    function startExperience() {
        if (entered) return;
        entered = true;
        hasAppliedStartOffset = false;
        audio.volume = 0.5;
        shouldForceStartOnReady = !seekAudioStart();
        setupAudioReactive();
        if (audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume().catch(function () {});
        }
        entryScreen.classList.add('is-exiting');

        setTimeout(function () {
            mainContent.classList.add('visible');
        }, 170);
        entryScreen.style.opacity = '0';
        entryScreen.style.filter = 'blur(4px)';
        setTimeout(function () {
            entryScreen.style.display = 'none';
        }, 1080);
        showPlayingNotice();

        var p = audio.play();
        if (p && typeof p.catch === 'function') {
            p.catch(function (e) {
                console.error('Playback failed:', e);
                showAudioLoadError();
            });
        }

        if (audio.error) {
            showAudioLoadError();
        }
    }

    entryScreen.addEventListener('click', startExperience);
    entryScreen.addEventListener('mousemove', setEntryParallax);
    entryScreen.addEventListener('mouseleave', resetEntryParallax);

    // Fallback: if first play attempt was blocked, retry on next user click.
    window.addEventListener('click', function () {
        if (!entered || !audio.paused || audio.error) return;
        enforceAudioStartOffset();
        if (audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume().catch(function () {});
        }
        audio.play().catch(function () {});
    }, { passive: true });

    document.addEventListener('keydown', function (e) {
        if (!e.key) return;
        var key = e.key.toLowerCase();
        if (key === 'r') {
            var enabled = document.body.classList.toggle('rage-mode');
            quakeBurst = enabled ? 2.8 : 1.1;
            showModeToast(enabled ? 'Rage Trippy Mode On' : 'Rage Trippy Mode Off');
            triggerModeSwitchHit();
            return;
        }
        if (key === 'g') {
            document.body.classList.add('glitch-burst');
            showModeToast('Glitch Burst');
            triggerModeSwitchHit();
            setTimeout(function () {
                document.body.classList.remove('glitch-burst');
            }, 620);
        }
    });

    audio.load();

    document.addEventListener('visibilitychange', function () {
        if (!document.hidden && entered && audio.paused && !audio.error) {
            enforceAudioStartOffset();
            audio.play().catch(function () {});
        }
    });
})();
