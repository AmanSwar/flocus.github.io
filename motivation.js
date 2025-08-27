document.addEventListener('DOMContentLoaded', () => {
    const playBtn = document.getElementById('play-tts');
    const pauseBtn = document.getElementById('pause-tts');
    const resumeBtn = document.getElementById('resume-tts');
    const stopBtn = document.getElementById('stop-tts');
    const contentToRead = document.querySelector('.widget-container');
    const ttsControls = document.getElementById('tts-controls');

    // Check if the browser supports the Speech Synthesis API
    if ('speechSynthesis' in window) {
        let voices = [];
        let utterance = new SpeechSynthesisUtterance();

        // This function tries to find the best available "natural" voice
        function findBestVoice() {
            voices = speechSynthesis.getVoices();
            let bestVoice = null;

            // Prioritize high-quality voices often found in modern browsers
            const preferredVoices = [
                "Google US English", // High quality on Chrome
                "Microsoft David - English (United States)", // High quality on Edge/Windows
                "Microsoft Zira - English (United States)", // Another high quality Windows voice
                "Siri", // High quality on Safari/macOS
            ];

            for (const name of preferredVoices) {
                bestVoice = voices.find(voice => voice.name === name);
                if (bestVoice) break;
            }

            // If no preferred voice is found, fall back to the first available US English voice
            if (!bestVoice) {
                bestVoice = voices.find(voice => voice.lang === 'en-US');
            }

            // If still no voice, just use the first one available
            if (!bestVoice) {
                bestVoice = voices[0];
            }

            return bestVoice;
        }

        // Voices load asynchronously, so we need to wait for the 'voiceschanged' event
        speechSynthesis.onvoiceschanged = () => {
            utterance.voice = findBestVoice();
        };

        // Update button visibility based on speech state
        function updateControls(state) {
            playBtn.style.display = (state === 'playing' || state === 'paused') ? 'none' : 'inline-block';
            pauseBtn.style.display = state === 'playing' ? 'inline-block' : 'none';
            resumeBtn.style.display = state === 'paused' ? 'inline-block' : 'none';
            stopBtn.style.display = (state === 'playing' || state === 'paused') ? 'inline-block' : 'none';
        }

        playBtn.addEventListener('click', () => {
            // If starting fresh, set up the utterance
            if (!speechSynthesis.speaking || speechSynthesis.paused) {
                // Cancel any previous speech to start clean
                speechSynthesis.cancel();

                utterance.text = contentToRead.innerText;
                utterance.rate = 0.95; // Slightly slower for clarity
                utterance.pitch = 1;

                // When speech starts
                utterance.onstart = () => {
                    updateControls('playing');
                };

                // When speech ends naturally
                utterance.onend = () => {
                    updateControls('stopped');
                };

                speechSynthesis.speak(utterance);
            }
        });

        pauseBtn.addEventListener('click', () => {
            if (speechSynthesis.speaking) {
                speechSynthesis.pause();
                updateControls('paused');
            }
        });

        resumeBtn.addEventListener('click', () => {
            if (speechSynthesis.paused) {
                speechSynthesis.resume();
                updateControls('playing');
            }
        });

        stopBtn.addEventListener('click', () => {
            speechSynthesis.cancel();
            updateControls('stopped');
        });

    } else {
        // If the browser doesn't support TTS, hide the controls
        console.log("Sorry, your browser does not support text-to-speech.");
        if (ttsControls) ttsControls.style.display = 'none';
    }
});