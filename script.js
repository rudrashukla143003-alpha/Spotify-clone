
const songs = [
    {
        id: 1,
        title: "Attention",
        artist: "Charlie Puth",
        image: "./Assets/attention.png",
        audio: "./Assets/songs/Attention.mp3"
    },
    {
        id: 2,
        title: "I Was Never There",
        artist: "The Weeknd",
        image: "./Assets/i-was-never-there.png",
        audio: "./Assets/songs/I Was Never There.mp3"
    },
    {
        id: 3,
        title: "Starboy",
        artist: "The Weeknd",
        image: "./Assets/starboy.png",
        audio: "./Assets/songs/Starboy.mp3"
    }
];

const audio = document.getElementById("audioPlayer");

const playPauseBtn = document.getElementById("playPauseBtn");
const previousBtn = document.getElementById("previousBtn");
const nextBtn = document.getElementById("nextBtn");
const shuffleBtn = document.getElementById("shuffleBtn");
const repeatBtn = document.getElementById("repeatBtn");

const progressBar = document.getElementById("progressBar");
const currentTimeLabel = document.getElementById("currentTime");
const totalTimeLabel = document.getElementById("totalTime");

const titleLabel = document.getElementById("currentSongTitle");
const artistLabel = document.getElementById("currentSongArtist");
const coverImage = document.getElementById("currentSongImage");

const likeBtn = document.getElementById("likeBtn");
const addToPlaylistBtn = document.getElementById("addToPlaylistBtn");

const volumeBar = document.getElementById("volumeBar");
const volumeIcon = document.getElementById("volumeIcon");

const searchInput = document.getElementById("searchInput");
const recentContainer = document.getElementById("recentContainer");
const playlistList = document.getElementById("playlistList");

let currentSongIndex = -1;
let shuffleEnabled = false;
let repeatEnabled = false;

function readStorage(key, fallback) {
    try {
        const value = JSON.parse(localStorage.getItem(key));
        return value ?? fallback;
    } catch {
        return fallback;
    }
}

function writeStorage(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

let recentSongIds = readStorage("recentSongIds", []);
let likedSongIds = readStorage("likedSongs", []);
let playlists = readStorage("playlists", []);

function formatTime(seconds) {
    if (!Number.isFinite(seconds) || seconds < 0) {
        return "0:00";
    }

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
}

function updatePlayButton() {
    const playing = !audio.paused;

    playPauseBtn.innerHTML = playing
        ? '<i class="fa-solid fa-pause"></i>'
        : '<i class="fa-solid fa-play"></i>';

    playPauseBtn.title = playing ? "Pause" : "Play";
}

function updateSongDetails(song) {
    titleLabel.textContent = song.title;
    artistLabel.textContent = song.artist;
    coverImage.src = song.image;
    coverImage.alt = `${song.title} cover`;

    updateLikeButton();
}

async function playSong(index) {
    if (
        !Number.isInteger(index) ||
        index < 0 ||
        index >= songs.length
    ) {
        return;
    }

    currentSongIndex = index;

    const song = songs[index];

    updateSongDetails(song);

    audio.src = song.audio;
    audio.load();

    recentSongIds = [
        song.id,
        ...recentSongIds.filter(id => id !== song.id)
    ].slice(0, 5);

    writeStorage("recentSongIds", recentSongIds);

    renderRecentlyPlayed();

    try {
        await audio.play();
    } catch (error) {
        console.error("Audio playback failed:", error);
        alert(`Unable to play ${song.title}. Check the MP3 file path.`);
    }
}

function togglePlayPause() {
    if (currentSongIndex === -1) {
        playSong(0);
        return;
    }

    if (audio.paused) {
        audio.play().catch(error => console.error(error));
    } else {
        audio.pause();
    }
}

playPauseBtn.addEventListener("click", togglePlayPause);

function nextSong() {
    if (currentSongIndex === -1) {
        playSong(0);
        return;
    }

    let nextIndex;

    if (shuffleEnabled && songs.length > 1) {
        do {
            nextIndex = Math.floor(Math.random() * songs.length);
        } while (nextIndex === currentSongIndex);
    } else {
        nextIndex = (currentSongIndex + 1) % songs.length;
    }

    playSong(nextIndex);
}

nextBtn.addEventListener("click", nextSong);

function previousSong() {
    if (currentSongIndex === -1) {
        playSong(0);
        return;
    }

    if (audio.currentTime > 3) {
        audio.currentTime = 0;
        return;
    }

    const previousIndex =
        (currentSongIndex - 1 + songs.length) % songs.length;

    playSong(previousIndex);
}

previousBtn.addEventListener("click", previousSong);

shuffleBtn.addEventListener("click", () => {
    shuffleEnabled = !shuffleEnabled;

    shuffleBtn.classList.toggle("active", shuffleEnabled);
    shuffleBtn.setAttribute("aria-pressed", String(shuffleEnabled));
});

repeatBtn.addEventListener("click", () => {
    repeatEnabled = !repeatEnabled;

    audio.loop = repeatEnabled;

    repeatBtn.classList.toggle("active", repeatEnabled);
    repeatBtn.setAttribute("aria-pressed", String(repeatEnabled));
});

audio.addEventListener("play", updatePlayButton);
audio.addEventListener("pause", updatePlayButton);

audio.addEventListener("ended", () => {
    if (!repeatEnabled) {
        nextSong();
    }
});

audio.addEventListener("loadedmetadata", () => {
    totalTimeLabel.textContent = formatTime(audio.duration);
    progressBar.value = 0;
});

audio.addEventListener("timeupdate", () => {
    if (!Number.isFinite(audio.duration) || audio.duration <= 0) {
        return;
    }

    progressBar.value =
        (audio.currentTime / audio.duration) * 100;

    currentTimeLabel.textContent =
        formatTime(audio.currentTime);
});

progressBar.addEventListener("input", () => {
    if (Number.isFinite(audio.duration) && audio.duration > 0) {
        audio.currentTime =
            (Number(progressBar.value) / 100) * audio.duration;
    }
});

audio.volume = Number(volumeBar.value);

function updateVolumeIcon() {
    if (audio.muted || audio.volume === 0) {
        volumeIcon.className = "fa-solid fa-volume-xmark";
    } else if (audio.volume < 0.5) {
        volumeIcon.className = "fa-solid fa-volume-low";
    } else {
        volumeIcon.className = "fa-solid fa-volume-high";
    }
}

volumeBar.addEventListener("input", () => {
    audio.volume = Number(volumeBar.value);
    audio.muted = audio.volume === 0;
    updateVolumeIcon();
});

volumeIcon.addEventListener("click", () => {
    if (audio.muted || audio.volume === 0) {
        audio.muted = false;
        audio.volume = Number(audio.dataset.previousVolume || 0.7);
        volumeBar.value = audio.volume;
    } else {
        audio.dataset.previousVolume = String(audio.volume);
        audio.muted = true;
    }

    updateVolumeIcon();
});

document.addEventListener("click", event => {
    const card = event.target.closest(".card[data-song-id]");

    if (!card) return;

    const songId = Number(card.dataset.songId);

    const index = songs.findIndex(song => song.id === songId);

    if (index !== -1) {
        playSong(index);
    }
});

document.addEventListener("keydown", event => {
    if (
        (event.key === "Enter" || event.key === " ") &&
        event.target.matches(".card[data-song-id]")
    ) {
        event.preventDefault();

        const index = songs.findIndex(
            song => song.id === Number(event.target.dataset.songId)
        );

        if (index !== -1) {
            playSong(index);
        }
    }
});

function renderRecentlyPlayed() {
    recentContainer.innerHTML = "";

    const recentSongs = recentSongIds
        .map(id => songs.find(song => song.id === id))
        .filter(Boolean);

    if (recentSongs.length === 0) {
        recentContainer.innerHTML = `
            <p class="empty-message">
                Your recently played songs will appear here.
            </p>
        `;
        return;
    }

    recentSongs.forEach(song => {
        const card = document.createElement("div");

        card.className = "card";
        card.dataset.songId = song.id;
        card.tabIndex = 0;
        card.setAttribute("role", "button");

        card.innerHTML = `
            <img src="${song.image}" class="card-img" alt="${escapeHTML(song.title)}">
            <p class="card-title">${escapeHTML(song.title)}</p>
            <p class="card-info">${escapeHTML(song.artist)}</p>
            <button class="card-play" type="button">
                <i class="fa-solid fa-play"></i>
            </button>
        `;

        recentContainer.appendChild(card);
    });
}

searchInput.addEventListener("input", () => {
    const query = searchInput.value.trim().toLowerCase();

    document.querySelectorAll(".card[data-song-id]").forEach(card => {
        const song = songs.find(
            item => item.id === Number(card.dataset.songId)
        );

        if (!song) return;

        const searchableText =
            `${song.title} ${song.artist}`.toLowerCase();

        card.hidden = !searchableText.includes(query);
    });
});

function updateLikeButton() {
    if (currentSongIndex === -1) return;

    const songId = songs[currentSongIndex].id;
    const liked = likedSongIds.includes(songId);

    likeBtn.className = liked
        ? "fa-solid fa-heart liked"
        : "fa-regular fa-heart";

    likeBtn.title = liked ? "Unlike song" : "Like song";
}

likeBtn.addEventListener("click", () => {
    if (currentSongIndex === -1) {
        alert("Select a song first.");
        return;
    }

    const songId = songs[currentSongIndex].id;

    if (likedSongIds.includes(songId)) {
        likedSongIds = likedSongIds.filter(id => id !== songId);
    } else {
        likedSongIds.push(songId);
    }

    writeStorage("likedSongs", likedSongIds);
    updateLikeButton();
});

function savePlaylists() {
    writeStorage("playlists", playlists);
}

function createPlaylist() {
    const name = prompt("Enter your playlist name:");

    if (!name || !name.trim()) return;

    playlists.push({
        id: Date.now(),
        name: name.trim(),
        songs: currentSongIndex === -1
            ? []
            : [songs[currentSongIndex].id]
    });

    savePlaylists();
    renderPlaylists();
}

document.getElementById("createPlaylistBtn")
    .addEventListener("click", createPlaylist);

document.getElementById("createPlaylistBox")
    .addEventListener("click", createPlaylist);

function addCurrentSongToPlaylist() {
    if (currentSongIndex === -1) {
        alert("Select a song first.");
        return;
    }

    if (playlists.length === 0) {
        alert("Create a playlist first.");
        return;
    }

    const options = playlists.map(
        (playlist, index) => `${index + 1}. ${playlist.name}`
    ).join("\n");

    const choice = prompt(
        `Add "${songs[currentSongIndex].title}" to which playlist?\n\n${options}`
    );

    if (choice === null) return;

    const index = Number(choice) - 1;

    if (
        !Number.isInteger(index) ||
        index < 0 ||
        index >= playlists.length
    ) {
        alert("Invalid playlist number.");
        return;
    }

    const songId = songs[currentSongIndex].id;

    if (playlists[index].songs.includes(songId)) {
        alert("Song already exists in this playlist.");
        return;
    }

    playlists[index].songs.push(songId);

    savePlaylists();
    renderPlaylists();

    alert("Song added successfully!");
}

addToPlaylistBtn.addEventListener("click", addCurrentSongToPlaylist);

addToPlaylistBtn.addEventListener("keydown", event => {
    if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        addCurrentSongToPlaylist();
    }
});

function renderPlaylists() {
    playlistList.innerHTML = "";

    if (playlists.length === 0) {
        playlistList.innerHTML = `
            <p class="empty-message">
                Your playlists will appear here.
            </p>
        `;
        return;
    }

    playlists.forEach(playlist => {
        const item = document.createElement("div");

        item.className = "playlist-item";
        item.tabIndex = 0;
        item.setAttribute("role", "button");

        const name = document.createElement("strong");
        name.textContent = playlist.name;

        const count = document.createElement("p");
        count.textContent = `${playlist.songs.length} songs`;

        item.append(name, count);

        function playPlaylist() {
            const firstAvailableId = playlist.songs.find(
                id => songs.some(song => song.id === id)
            );

            const index = songs.findIndex(
                song => song.id === firstAvailableId
            );

            if (index === -1) {
                alert("This playlist is empty. Add songs first.");
                return;
            }

            playSong(index);
        }

        item.addEventListener("click", playPlaylist);

        item.addEventListener("keydown", event => {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                playPlaylist();
            }
        });

        playlistList.appendChild(item);
    });
}

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

document.getElementById("backBtn").addEventListener("click", () => {
    document.querySelector(".main-content").scrollTo({
        top: 0,
        behavior: "smooth"
    });
});

document.getElementById("forwardBtn").addEventListener("click", () => {
    const main = document.querySelector(".main-content");

    main.scrollTo({
        top: main.scrollHeight,
        behavior: "smooth"
    });
});

renderRecentlyPlayed();
renderPlaylists();
updatePlayButton();
updateVolumeIcon();
