document.addEventListener('DOMContentLoaded', () => {
    const photoInput = document.getElementById('photoInput');
    const uploadBtn = document.getElementById('uploadBtn');
    const gallery = document.getElementById('gallery');
    const userNameInput = document.getElementById('userName');

    // Load existing photos from MongoDB
    loadPhotos();

    uploadBtn.addEventListener('click', () => {
        if (!userNameInput.value.trim()) {
            alert('Please enter your name first!');
            return;
        }
        photoInput.click();
    });

    photoInput.addEventListener('change', handlePhotoUpload);

    async function handlePhotoUpload(event) {
        const files = event.target.files;
        const userName = userNameInput.value.trim();
        
        for (let file of files) {
            if (file.type.startsWith('image/')) {
                try {
                    const formData = new FormData();
                    formData.append('photo', file);
                    formData.append('userName', userName);

                    const response = await fetch('/api/upload', {
                        method: 'POST',
                        body: formData
                    });

                    const data = await response.json();

                    if (!response.ok) {
                        throw new Error(data.error || 'Failed to upload photo');
                    }

                    if (data.success) {
                        // Add to gallery
                        addPhotoToGallery(data.photo.imageUrl, data.photo.userName);
                        
                        // Clear the input
                        photoInput.value = '';
                    }
                } catch (error) {
                    console.error('Error uploading photo:', error);
                    alert(`Error uploading photo: ${error.message}. Please try again.`);
                }
            } else {
                alert('Please select an image file.');
            }
        }
    }

    async function loadPhotos() {
        try {
            const response = await fetch('/api/photos');
            if (!response.ok) {
                throw new Error('Failed to fetch photos');
            }
            
            const photos = await response.json();
            photos.forEach(photo => {
                addPhotoToGallery(photo.imageUrl, photo.userName);
            });
        } catch (error) {
            console.error('Error loading photos:', error);
            alert('Error loading photos. Please refresh the page.');
        }
    }

    function addPhotoToGallery(imageUrl, userName) {
        const galleryItem = document.createElement('div');
        galleryItem.className = 'gallery-item';
        
        const img = document.createElement('img');
        img.src = imageUrl;
        img.alt = 'Photo with Kizer';
        
        // Add loading animation
        img.style.opacity = '0';
        img.style.transition = 'opacity 0.5s ease-in';
        
        img.onload = () => {
            img.style.opacity = '1';
        };

        const photoInfo = document.createElement('div');
        photoInfo.className = 'photo-info';
        photoInfo.textContent = `Shared by ${userName}`;
        
        galleryItem.appendChild(img);
        galleryItem.appendChild(photoInfo);
        gallery.insertBefore(galleryItem, gallery.firstChild);
    }

    // Add some fun animations when the page loads
    const title = document.querySelector('.title');
    const cake = document.querySelector('.cake-container');
    
    setTimeout(() => {
        title.style.animation = 'bounce 2s infinite';
    }, 500);
    
    setTimeout(() => {
        cake.style.animation = 'wobble 3s infinite';
    }, 1000);

    // Guestbook logic
    const guestbookForm = document.getElementById('guestbookForm');
    const guestName = document.getElementById('guestName');
    const guestMessage = document.getElementById('guestMessage');
    const messagesList = document.getElementById('messagesList');

    if (guestbookForm) {
        guestbookForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = guestName.value.trim();
            const message = guestMessage.value.trim();
            if (!name || !message) return;
            try {
                const res = await fetch('/api/messages', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, message })
                });
                if (res.ok) {
                    guestName.value = '';
                    guestMessage.value = '';
                    loadMessages();
                }
            } catch (err) {
                alert('Error sending message.');
            }
        });
        loadMessages();
    }

    async function loadMessages() {
        try {
            const res = await fetch('/api/messages');
            const messages = await res.json();
            messagesList.innerHTML = '';
            messages.forEach(msg => {
                const div = document.createElement('div');
                div.className = 'guest-message';
                div.innerHTML = `<strong>${msg.name}:</strong> ${msg.message} <span class="msg-time">${new Date(msg.timestamp).toLocaleString()}</span>`;
                messagesList.appendChild(div);
            });
        } catch (err) {
            messagesList.innerHTML = '<p>Could not load messages.</p>';
        }
    }

    // --- Cake Designer Section ---
    (function() {
        const cakeBase = document.getElementById('cakeDesignerBase');
        const cakeOptions = document.getElementById('cakeOptions');
        const clearBtn = document.getElementById('clearCakeBtn');
        if (!cakeBase || !cakeOptions || !clearBtn) return;

        // Drag from options to cake
        cakeOptions.querySelectorAll('.cake-deco').forEach(deco => {
            deco.ondragstart = (e) => {
                e.dataTransfer.setData('text/plain', deco.innerText);
            };
        });

        cakeBase.ondragover = (e) => { e.preventDefault(); };
        cakeBase.ondrop = (e) => {
            e.preventDefault();
            const emoji = e.dataTransfer.getData('text/plain');
            if (emoji) {
                addDraggableDeco(emoji, e.offsetX, e.offsetY);
            }
        };

        function addDraggableDeco(emoji, x, y) {
            const deco = document.createElement('div');
            deco.className = 'cake-draggable';
            deco.innerText = emoji;
            deco.style.left = (x - 19) + 'px';
            deco.style.top = (y - 19) + 'px';
            deco.draggable = true;
            deco.style.transform = 'rotate(0deg) scale(1)';
            let rotation = 0;
            let scale = 1;

            // Delete button
            const delBtn = document.createElement('button');
            delBtn.innerText = '🗑️';
            delBtn.className = 'deco-delete-btn';
            delBtn.onclick = function(e) {
                e.stopPropagation();
                deco.remove();
            };
            deco.appendChild(delBtn);

            // Drag within cake
            deco.onmousedown = function(e) {
                if (e.target === delBtn) return;
                let shiftX = e.clientX - deco.getBoundingClientRect().left;
                let shiftY = e.clientY - deco.getBoundingClientRect().top;
                function moveAt(pageX, pageY) {
                    const rect = cakeBase.getBoundingClientRect();
                    let newX = pageX - rect.left - shiftX;
                    let newY = pageY - rect.top - shiftY;
                    newX = Math.max(0, Math.min(newX, cakeBase.offsetWidth - deco.offsetWidth));
                    newY = Math.max(0, Math.min(newY, cakeBase.offsetHeight - deco.offsetHeight));
                    deco.style.left = newX + 'px';
                    deco.style.top = newY + 'px';
                }
                function onMouseMove(e) {
                    moveAt(e.pageX, e.pageY);
                }
                document.addEventListener('mousemove', onMouseMove);
                document.onmouseup = function() {
                    document.removeEventListener('mousemove', onMouseMove);
                    document.onmouseup = null;
                };
                e.preventDefault();
            };
            // Rotate on right-click
            deco.oncontextmenu = function(e) {
                e.preventDefault();
                rotation = (rotation + 30) % 360;
                deco.style.transform = `rotate(${rotation}deg) scale(${scale})`;
            };
            // Resize with mouse wheel
            deco.onwheel = function(e) {
                e.preventDefault();
                scale += e.deltaY < 0 ? 0.1 : -0.1;
                scale = Math.max(0.5, Math.min(scale, 2));
                deco.style.transform = `rotate(${rotation}deg) scale(${scale})`;
            };
            cakeBase.appendChild(deco);
        }

        clearBtn.onclick = function() {
            cakeBase.querySelectorAll('.cake-draggable').forEach(el => el.remove());
        };
    })();

    // --- Improved Balloon Pop Game ---
    (function() {
        const gameArea = document.getElementById('gameArea');
        const gameScore = document.getElementById('gameScore');
        if (!gameArea || !gameScore) return;

        let score = 0;
        let highScore = 0;
        let gameActive = true;
        let balloonInterval;
        let popSound;

        // Optional: Add a pop sound
        try {
            popSound = new Audio('https://cdn.pixabay.com/audio/2022/07/26/audio_124bfae5b2.mp3');
        } catch {}

        function randomColor() {
            return `hsl(${Math.random()*360},90%,${60+Math.random()*20}%)`;
        }
        function randomEmoji() {
            const emojis = ['🎈','🎉','🥳','💥','✨','🎊'];
            return emojis[Math.floor(Math.random()*emojis.length)];
        }
        function spawnBalloon() {
            if (!gameActive) return;
            const balloon = document.createElement('div');
            balloon.className = 'balloon-game improved';
            const size = 40 + Math.random()*40;
            balloon.style.width = size + 'px';
            balloon.style.height = (size*1.4) + 'px';
            balloon.style.left = Math.random() * (gameArea.offsetWidth - size) + 'px';
            balloon.style.background = randomColor();
            balloon.style.animationDuration = (2 + Math.random() * 2) + 's';
            balloon.innerHTML = `<span class="balloon-emoji">${randomEmoji()}</span>`;
            balloon.tabIndex = 0;
            balloon.onclick = balloon.ontouchstart = function(e) {
                if (!gameActive) return;
                score++;
                animateScore();
                gameScore.textContent = 'Score: ' + score;
                balloon.remove();
                if (popSound) { try { popSound.currentTime = 0; popSound.play(); } catch {} }
                e.stopPropagation();
            };
            gameArea.appendChild(balloon);
            setTimeout(() => {
                if (balloon.parentNode) balloon.remove();
            }, 4000);
        }
        function animateScore() {
            gameScore.style.transform = 'scale(1.2)';
            setTimeout(() => { gameScore.style.transform = 'scale(1)'; }, 150);
        }
        function startGame() {
            score = 0;
            gameActive = true;
            gameScore.textContent = 'Score: 0';
            gameArea.innerHTML = '';
            gameScore.style.display = '';
            if (balloonInterval) clearInterval(balloonInterval);
            balloonInterval = setInterval(spawnBalloon, 800);
            setTimeout(endGame, 30000); // 30 seconds per round
        }
        function endGame() {
            gameActive = false;
            if (balloonInterval) clearInterval(balloonInterval);
            highScore = Math.max(highScore, score);
            gameScore.textContent = `Final Score: ${score}  |  High Score: ${highScore}`;
            const msg = document.createElement('div');
            msg.className = 'game-over-msg';
            msg.innerHTML = `<strong>Great job!</strong><br>Final Score: ${score}<br><button id='playAgainBtn'>Play Again</button>`;
            gameArea.innerHTML = '';
            gameArea.appendChild(msg);
            document.getElementById('playAgainBtn').onclick = startGame;
        }
        // Responsive
        window.addEventListener('resize', () => {
            if (!gameActive) gameArea.innerHTML = '';
        });
        // Start the game
        startGame();
    })();
}); 