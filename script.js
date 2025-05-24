document.addEventListener('DOMContentLoaded', () => {
    const appTitle = document.getElementById('appTitle');
    const titleBackgroundImage = document.getElementById('titleBackgroundImage');
    const peeButton = document.getElementById('peeButton');
    const pooButton = document.getElementById('pooButton');
    const peeButtonImage = document.getElementById('peeButtonImage');
    const pooButtonImage = document.getElementById('pooButtonImage');

    const datePicker = document.getElementById('datePicker');
    const selectedDateDayOfWeekDisplay = document.getElementById('selectedDateDayOfWeek');
    const peeDateDisplay = document.getElementById('peeDate');
    const pooDateDisplay = document.getElementById('pooDate');
    const peeRecordList = document.getElementById('peeRecordList');
    const pooRecordList = document.getElementById('pooRecordList');

    const menuIcon = document.getElementById('menuIcon');
    const sideMenu = document.getElementById('sideMenu');
    const overlay = document.getElementById('overlay');
    const settingsMenu = document.getElementById('settingsMenu');
    const exportDataMenu = document.getElementById('exportDataMenu');

    const settingsModal = document.getElementById('settingsModal');
    const closeSettingsModal = document.getElementById('closeSettingsModal');
    const titleBgImageUpload = document.getElementById('titleBgImageUpload');
    const titleBgPreview = document.getElementById('titleBgPreview');
    const peeImageUpload = document.getElementById('peeImageUpload');
    const peeImagePreview = document.getElementById('peeImagePreview');
    const pooImageUpload = document.getElementById('pooImageUpload');
    const pooImagePreview = document.getElementById('pooImagePreview');
    const saveSettingsButton = document.getElementById('saveSettingsButton');

    let currentSelectedDate = formatDate(new Date());
    let records = {}; // { "YYYY-MM-DD": { pee: [], poo: [] }, ... }

    // --- 初期化処理 ---
    function initialize() {
        loadRecords();
        loadSettings();
        datePicker.value = currentSelectedDate;
        updateDateDisplays();
        renderRecords();
        setupEventListeners();
    }

    function setupEventListeners() {
        peeButton.addEventListener('click', () => addRecord('pee'));
        pooButton.addEventListener('click', () => addRecord('poo'));
        datePicker.addEventListener('change', handleDateChange);

        menuIcon.addEventListener('click', toggleMenu);
        overlay.addEventListener('click', closeMenu);
        settingsMenu.addEventListener('click', (e) => {
            e.preventDefault();
            openSettingsModal();
            closeMenu();
        });
        exportDataMenu.addEventListener('click', (e) => {
            e.preventDefault();
            exportDataAsCSV();
            closeMenu();
        });

        closeSettingsModal.addEventListener('click', () => settingsModal.style.display = 'none');
        window.addEventListener('click', (event) => { 
            if (event.target == settingsModal) {
                settingsModal.style.display = 'none';
            }
        });

        titleBgImageUpload.addEventListener('change', (e) => previewImage(e.target, titleBgPreview));
        peeImageUpload.addEventListener('change', (e) => previewImage(e.target, peeImagePreview));
        pooImageUpload.addEventListener('change', (e) => previewImage(e.target, pooImagePreview));
        saveSettingsButton.addEventListener('click', saveAllSettings);
    }

    // --- メニュー関連 ---
    function toggleMenu() {
        sideMenu.classList.toggle('open');
        overlay.classList.toggle('active');
    }

    function closeMenu() {
        sideMenu.classList.remove('open');
        overlay.classList.remove('active');
    }

    // --- 設定モーダル関連 ---
    function openSettingsModal() {
        const settings = getSettings();
        titleBgPreview.src = settings.titleBgImage || 'https://via.placeholder.com/100x100/DDDDDD/888888?text=背景';
        peeImagePreview.src = settings.peeButtonImage || 'https://via.placeholder.com/100x60/FFFFE0/000000?text=おしっこ';
        pooImagePreview.src = settings.pooButtonImage || 'https://via.placeholder.com/100x60/D2B48C/FFFFFF?text=うんち';
        settingsModal.style.display = 'block';
    }

    function previewImage(input, previewElement) {
        const file = input.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                previewElement.src = e.target.result;
            }
            reader.readAsDataURL(file);
        }
    }

    function saveImageSetting(fileInput, previewElement, storageKey) {
        return new Promise((resolve) => {
            const file = fileInput.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    localStorage.setItem(storageKey, e.target.result);
                    resolve(e.target.result); 
                }
                reader.readAsDataURL(file);
            } else {
                const currentSrc = previewElement.src;
                if (currentSrc && !currentSrc.startsWith('https://via.placeholder.com') && !currentSrc.endsWith('#')) { 
                     localStorage.setItem(storageKey, currentSrc);
                     resolve(currentSrc);
                } else {
                    localStorage.removeItem(storageKey); 
                    resolve(null);
                }
            }
        });
    }

    async function saveAllSettings() {
        const settings = {};
        settings.titleBgImage = await saveImageSetting(titleBgImageUpload, titleBgPreview, 'chokoCheck_titleBgImage');
        settings.peeButtonImage = await saveImageSetting(peeImageUpload, peeImagePreview, 'chokoCheck_peeButtonImage');
        settings.pooButtonImage = await saveImageSetting(pooImageUpload, pooImagePreview, 'chokoCheck_pooButtonImage');

        applySettings(settings);
        settingsModal.style.display = 'none';
        alert('設定を保存しました。');
    }

    function loadSettings() {
        const settings = getSettings();
        applySettings(settings);
    }
    
    function getSettings() {
        return {
            titleBgImage: localStorage.getItem('chokoCheck_titleBgImage'),
            peeButtonImage: localStorage.getItem('chokoCheck_peeButtonImage'),
            pooButtonImage: localStorage.getItem('chokoCheck_pooButtonImage')
        };
    }

    function applySettings(settings) {
        if (settings.titleBgImage) {
            titleBackgroundImage.style.backgroundImage = `url(${settings.titleBgImage})`;
        } else {
            titleBackgroundImage.style.backgroundImage = `url('https://via.placeholder.com/420x100/DDDDDD/888888?text=背景画像エリア')`; 
        }
        if (settings.peeButtonImage) {
            peeButtonImage.src = settings.peeButtonImage;
        } else {
            peeButtonImage.src = 'https://via.placeholder.com/100x60/FFFFE0/000000?text=おしっこ'; 
        }
        if (settings.pooButtonImage) {
            pooButtonImage.src = settings.pooButtonImage;
        } else {
            pooButtonImage.src = 'https://via.placeholder.com/100x60/D2B48C/FFFFFF?text=うんち'; 
        }
    }


    // --- データ記録・表示関連 ---
    function loadRecords() {
        const storedRecords = localStorage.getItem('chokoCheckRecords');
        if (storedRecords) {
            records = JSON.parse(storedRecords);
        }
    }

    function saveRecords() {
        localStorage.setItem('chokoCheckRecords', JSON.stringify(records));
    }

    function addRecord(type) {
        const now = new Date();
        const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

        if (!records[currentSelectedDate]) {
            records[currentSelectedDate] = { pee: [], poo: [] };
        }

        records[currentSelectedDate][type].push(time); 
        saveRecords();
        renderRecords();
    }

    function renderRecords() {
        peeRecordList.innerHTML = '';
        pooRecordList.innerHTML = '';

        const dayRecords = records[currentSelectedDate] || { pee: [], poo: [] };

        renderList(dayRecords.pee, peeRecordList, 'pee');
        renderList(dayRecords.poo, pooRecordList, 'poo');
    }

    function renderList(items, listElement, type) {
        items.forEach((time, index) => { 
            const li = document.createElement('li');
            
            const timeText = document.createElement('span');
            timeText.textContent = time;
            timeText.classList.add('time-text');
            timeText.dataset.type = type;
            timeText.dataset.originalArrayIndex = index; 
            timeText.dataset.time = time;

            const deleteBtn = document.createElement('span');
            deleteBtn.textContent = '×';
            deleteBtn.classList.add('delete-btn');
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation(); 
                deleteRecord(type, parseInt(timeText.dataset.originalArrayIndex, 10));
            });
            
            timeText.addEventListener('dblclick', function(event) { 
                handleTimeInteraction(this, deleteBtn);
            });

            li.appendChild(timeText);
            li.appendChild(deleteBtn);
            listElement.appendChild(li);
        });
    }

    function handleTimeInteraction(timeTextElement, deleteBtnElement) {
        const type = timeTextElement.dataset.type;
        const originalArrayIndex = parseInt(timeTextElement.dataset.originalArrayIndex, 10);
        let currentStoredTime = timeTextElement.dataset.time; 

        // 他のアイテムの編集モードを解除し、削除ボタンを隠す
        document.querySelectorAll('.record-list li').forEach(li => {
            const otherTimeText = li.querySelector('.time-text');
            const otherDeleteBtn = li.querySelector('.delete-btn');

            if (otherTimeText !== timeTextElement) {
                if (otherTimeText.querySelector('input')) { 
                    otherTimeText.textContent = otherTimeText.dataset.time; // 編集中なら元の時刻に戻す
                }
                if (otherDeleteBtn) {
                    otherDeleteBtn.style.display = 'none'; // 他の削除ボタンを隠す
                }
            }
        });

        // 選択されたアイテムの削除ボタンを表示
        deleteBtnElement.style.display = 'block';

        // 既に編集中でなければ編集UIを作成
        if (!timeTextElement.querySelector('input[type="time"]')) {
            timeTextElement.dataset.originalTimeForCancel = currentStoredTime; 

            const input = document.createElement('input');
            input.type = 'time';
            input.value = currentStoredTime;
            
            timeTextElement.textContent = ''; 
            timeTextElement.appendChild(input);
            input.focus();
            input.select(); 

            const finalizeEditing = (saveChanges) => {
                if (!document.body.contains(input)) return; 

                const newTime = input.value;
                timeTextElement.removeChild(input); 

                if (saveChanges && newTime && newTime !== currentStoredTime) {
                    records[currentSelectedDate][type][originalArrayIndex] = newTime;
                    saveRecords();
                    timeTextElement.textContent = newTime;
                    timeTextElement.dataset.time = newTime; 
                } else {
                    timeTextElement.textContent = timeTextElement.dataset.originalTimeForCancel; 
                }
                // ★★★ 修正点: 編集完了後に削除ボタンを非表示にする ★★★
                deleteBtnElement.style.display = 'none'; 
            };

            input.addEventListener('blur', () => {
                setTimeout(() => { 
                    if (document.body.contains(input)) finalizeEditing(true);
                }, 100); 
            });

            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    finalizeEditing(true);
                } else if (e.key === 'Escape') {
                    e.preventDefault();
                    finalizeEditing(false);
                    // finalizeEditing内で削除ボタンは非表示になるので、ここでは追加処理不要
                }
            });
        } else {
            // 既に編集モードの場合（inputが表示されている状態で再度ダブルクリックされた場合）
            // 編集をキャンセルして元の時刻に戻し、削除ボタンの表示をトグルする
            const inputElement = timeTextElement.querySelector('input[type="time"]');
            if(inputElement) { 
                 timeTextElement.textContent = timeTextElement.dataset.originalTimeForCancel; 
                 timeTextElement.removeChild(inputElement); // input要素を確実に削除
            }
            // 削除ボタンの表示/非表示をトグル
            deleteBtnElement.style.display = deleteBtnElement.style.display === 'none' ? 'block' : 'none';
        }
    }

    function deleteRecord(type, index) {
        if (records[currentSelectedDate] && records[currentSelectedDate][type] && records[currentSelectedDate][type][index] !== undefined) {
            if (confirm(`時刻「${records[currentSelectedDate][type][index]}」を削除しますか？`)) {
                records[currentSelectedDate][type].splice(index, 1);
                saveRecords();
                renderRecords(); 
            }
        }
    }

    function handleDateChange() {
        currentSelectedDate = datePicker.value;
        updateDateDisplays(); 
        renderRecords();
    }

    function updateDateDisplays() {
        const dateObj = new Date(currentSelectedDate + 'T00:00:00'); 
        const displayDate = `${dateObj.getFullYear()}/${String(dateObj.getMonth() + 1).padStart(2, '0')}/${String(dateObj.getDate()).padStart(2, '0')}`;
        const dayStr = getDayOfWeek(dateObj);
        
        // 記録エリアの日付表示形式を修正
        peeDateDisplay.textContent = `おしっこ ${displayDate}(${dayStr})`;
        pooDateDisplay.textContent = `うんち ${displayDate}(${dayStr})`;
        
        if (selectedDateDayOfWeekDisplay) { 
            selectedDateDayOfWeekDisplay.textContent = `(${dayStr})`;
        }
    }

    function formatDate(date) { 
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }

    function getDayOfWeek(date) {
        const days = ['日', '月', '火', '水', '木', '金', '土'];
        return days[date.getDay()];
    }

    function exportDataAsCSV() {
        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "タイプ,日付,曜日,時刻\r\n"; 

        const sortedDates = Object.keys(records).sort(); 

        sortedDates.forEach(dateStr => {
            const dateObj = new Date(dateStr + 'T00:00:00');
            const dayOfWeek = getDayOfWeek(dateObj);
            const dayRecords = records[dateStr];

            if (dayRecords.pee) {
                dayRecords.pee.forEach(time => {
                    csvContent += `おしっこ,${dateStr},${dayOfWeek},${time}\r\n`;
                });
            }
            if (dayRecords.poo) {
                dayRecords.poo.forEach(time => {
                    csvContent += `うんち,${dateStr},${dayOfWeek},${time}\r\n`;
                });
            }
        });

        if (csvContent === "data:text/csv;charset=utf-8,タイプ,日付,曜日,時刻\r\n") {
            alert("エクスポートするデータがありません。");
            return;
        }

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        const timestamp = formatDate(new Date()).replace(/-/g, "") + String(new Date().getHours()).padStart(2, '0') + String(new Date().getMinutes()).padStart(2, '0');
        link.setAttribute("download", `choko_check_data_${timestamp}.csv`);
        document.body.appendChild(link); 
        link.click();
        document.body.removeChild(link);
    }

    initialize();
});
