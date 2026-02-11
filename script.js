// ===== 全局变量 =====
let currentSection = 0;
const sections = ['cake-section', 'blessing-section', 'memories-section', 'letter-section', 'ending-section'];
let musicPlaying = false;
let audioContextInitialized = false;

// ===== 检测移动设备 =====
function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           (window.innerWidth <= 768 && 'ontouchstart' in window);
}

// ===== DOM 元素 =====
const blowBtn = document.getElementById('blow-btn');
const candles = document.querySelectorAll('.candle');
const cake = document.querySelector('.cake');
const cakeSection = document.getElementById('cake-section');
const bgMusic = document.getElementById('bg-music');
const musicToggle = document.getElementById('music-toggle');

// ===== 初始化 =====
document.addEventListener('DOMContentLoaded', () => {
    // 绑定吹蜡烛按钮
    if (blowBtn) {
        blowBtn.addEventListener('click', handleBlowCandles);
    }
    
    // 绑定音乐控制
    if (musicToggle) {
        musicToggle.addEventListener('click', toggleMusic);
    }
    
    // 绑定打开信按钮
    const openLetterBtn = document.getElementById('open-letter-btn');
    const closeLetterBtn = document.getElementById('close-letter-btn');
    const letterModal = document.getElementById('letter-modal');
    
    if (openLetterBtn) {
        openLetterBtn.addEventListener('click', openLetter);
    }
    
    if (closeLetterBtn) {
        closeLetterBtn.addEventListener('click', closeLetter);
    }
    
    if (letterModal) {
        letterModal.addEventListener('click', (e) => {
            if (e.target === letterModal) {
                closeLetter();
            }
        });
    }
    
    // ESC键关闭信件
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && letterModal && letterModal.classList.contains('show')) {
            closeLetter();
        }
    });
    
    // 绑定星星点击音效
    const clickableStars = document.querySelectorAll('.clickable-star');
    clickableStars.forEach(star => {
        star.addEventListener('click', () => {
            playStarClickSound();
        });
    });
    
    // 绑定按钮点击音效
    const blowButton = document.getElementById('blow-btn');
    if (blowButton) {
        blowButton.addEventListener('click', () => {
            playButtonClickSound();
        });
    }
    
    // 初始化滚动监听
    initScrollListeners();
    
    // 初始化3D蛋糕鼠标跟随效果
    initCake3DEffect();
    
    // 绑定返回按钮
    initBackButton();
    
    // 移动设备上，确保在用户交互后才初始化音频
    const initMusicOnInteraction = () => {
        if (!musicPlaying) {
            // 先尝试播放文件音乐
            attemptPlayMusic();
            
            // 如果文件音乐失败，生成生日歌
            setTimeout(() => {
                if (!musicPlaying) {
                    // 移动设备上使用更兼容的方式
                    if (isMobileDevice()) {
                        useAudioElementBirthdaySong();
                    } else {
                        generateBirthdaySong();
                    }
                }
            }, 500);
        }
    };
    
    // 监听用户交互（移动设备必须）
    document.addEventListener('click', initMusicOnInteraction, { once: true });
    document.addEventListener('touchstart', initMusicOnInteraction, { once: true });
    
    // 吹蜡烛按钮点击时也尝试播放音乐
    if (blowBtn) {
        blowBtn.addEventListener('click', () => {
            if (!musicPlaying) {
                initMusicOnInteraction();
            }
        }, { once: true });
    }
});

// ===== 吹蜡烛交互 =====
function handleBlowCandles() {
    if (blowBtn.disabled) return;
    
    blowBtn.disabled = true;
    blowBtn.style.opacity = '0.5';
    
    // 播放吹蜡烛音效
    playBlowSound();
    
    // 逐个熄灭蜡烛
    blowCandlesSequentially();
}

// ===== 生成吹蜡烛音效 =====
function playBlowSound() {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // 创建"呼"的声音 - 使用白噪声和低通滤波器
        const duration = 0.8; // 持续时间
        const sampleRate = audioContext.sampleRate;
        const buffer = audioContext.createBuffer(1, sampleRate * duration, sampleRate);
        const data = buffer.getChannelData(0);
        
        // 生成白噪声
        for (let i = 0; i < data.length; i++) {
            data[i] = (Math.random() * 2 - 1) * 0.3;
        }
        
        // 创建低通滤波器（模拟"呼"的声音）
        const filter = audioContext.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 800; // 低频
        filter.Q.value = 1;
        
        // 创建增益节点（音量包络）
        const gainNode = audioContext.createGain();
        gainNode.gain.setValueAtTime(0.4, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
        
        // 创建音频源
        const source = audioContext.createBufferSource();
        source.buffer = buffer;
        
        // 连接：源 -> 滤波器 -> 增益 -> 输出
        source.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // 播放
        source.start(0);
        source.stop(audioContext.currentTime + duration);
        
    } catch (error) {
        console.log('无法播放吹蜡烛音效:', error);
    }
}

// ===== 生成星星点击音效 =====
function playStarClickSound() {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // 创建清脆的"叮"声
        const duration = 0.3;
        const sampleRate = audioContext.sampleRate;
        const buffer = audioContext.createBuffer(1, sampleRate * duration, sampleRate);
        const data = buffer.getChannelData(0);
        
        // 生成正弦波，频率从高到低
        const startFreq = 800;
        const endFreq = 400;
        
        for (let i = 0; i < data.length; i++) {
            const t = i / sampleRate;
            const freq = startFreq + (endFreq - startFreq) * (t / duration);
            const phase = 2 * Math.PI * freq * t;
            data[i] = Math.sin(phase) * 0.3 * (1 - t / duration);
        }
        
        // 添加高频谐波
        for (let i = 0; i < data.length; i++) {
            const t = i / sampleRate;
            const freq2 = startFreq * 2 + (endFreq * 2 - startFreq * 2) * (t / duration);
            const phase2 = 2 * Math.PI * freq2 * t;
            data[i] += Math.sin(phase2) * 0.15 * (1 - t / duration);
        }
        
        const source = audioContext.createBufferSource();
        source.buffer = buffer;
        
        const gainNode = audioContext.createGain();
        gainNode.gain.setValueAtTime(0.4, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
        
        source.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        source.start(0);
        source.stop(audioContext.currentTime + duration);
        
    } catch (error) {
        console.log('无法播放星星点击音效:', error);
    }
}

// ===== 生成按钮点击音效 =====
function playButtonClickSound() {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // 创建短促的"咔"声
        const duration = 0.15;
        const sampleRate = audioContext.sampleRate;
        const buffer = audioContext.createBuffer(1, sampleRate * duration, sampleRate);
        const data = buffer.getChannelData(0);
        
        // 生成短促的点击声
        for (let i = 0; i < data.length; i++) {
            const t = i / sampleRate;
            const freq = 600;
            const phase = 2 * Math.PI * freq * t;
            // 快速衰减
            const envelope = Math.exp(-t * 30);
            data[i] = Math.sin(phase) * 0.2 * envelope;
        }
        
        const source = audioContext.createBufferSource();
        source.buffer = buffer;
        
        const gainNode = audioContext.createGain();
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
        
        source.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        source.start(0);
        source.stop(audioContext.currentTime + duration);
        
    } catch (error) {
        console.log('无法播放按钮点击音效:', error);
    }
}

function blowCandlesSequentially() {
    const candleArray = Array.from(candles);
    let index = 0;
    
    const blowNext = () => {
        if (index < candleArray.length) {
            const candle = candleArray[index];
            
            // 添加熄灭类
            candle.classList.add('blown');
            
            // 播放下一个蜡烛
            index++;
            setTimeout(blowNext, 200); // 每个蜡烛间隔200ms
        } else {
            // 所有蜡烛熄灭后
            setTimeout(() => {
                // 页面变暗
                cakeSection.classList.add('darken');
                
                // 0.5秒后确保音乐播放（如果还没播放）
                setTimeout(() => {
                    if (!musicPlaying && bgMusic) {
                        playMusic();
                    }
                }, 500);
                
                // 蛋糕淡出
                setTimeout(() => {
                    cake.classList.add('fade-out');
                    // 停止3D效果
                    cake.style.transform = 'translateY(0) rotateX(0deg) rotateY(0deg)';
                }, 300);
                
                // 1.5秒后切换到祝福页面
                setTimeout(() => {
                    switchToNextSection();
                }, 2000);
            }, 500);
        }
    };
    
    blowNext();
}

// ===== 初始化返回按钮 =====
function initBackButton() {
    const backButtons = document.querySelectorAll('.back-button');
    
    backButtons.forEach(button => {
        button.addEventListener('click', () => {
            playButtonClickSound();
            switchToPreviousSection();
        });
    });
}

// ===== 返回上一页 =====
function switchToPreviousSection() {
    if (currentSection <= 0) return; // 已经在第一页，无法返回
    
    const currentSectionEl = document.getElementById(sections[currentSection]);
    if (currentSectionEl) {
        currentSectionEl.classList.remove('active');
    }
    
    currentSection--;
    
    const previousSectionEl = document.getElementById(sections[currentSection]);
    if (previousSectionEl) {
        previousSectionEl.classList.add('active');
        
        // 滚动到上一页
        setTimeout(() => {
            previousSectionEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
        
        // 如果是第一页（蛋糕页面），重新初始化3D效果
        if (currentSection === 0) {
            setTimeout(() => {
                initCake3DEffect();
            }, 500);
        }
    }
}

// ===== 页面切换 =====
function switchToNextSection() {
    const currentSectionEl = document.getElementById(sections[currentSection]);
    if (currentSectionEl) {
        currentSectionEl.classList.remove('active');
    }
    
    currentSection++;
    
    if (currentSection < sections.length) {
        const nextSectionEl = document.getElementById(sections[currentSection]);
        if (nextSectionEl) {
            nextSectionEl.classList.add('active');
            
            // 滚动到新页面
            setTimeout(() => {
                nextSectionEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
            
            // 根据页面类型执行不同的动画
            if (currentSection === 1) {
                // 祝福文字页面
                setTimeout(() => {
                    showBlessingText();
                }, 500);
            } else if (currentSection === 2) {
                // 回忆相册页面
                setTimeout(() => {
                    showMemories();
                }, 500);
            } else if (currentSection === 3) {
                // 信件页面
                setTimeout(() => {
                    showLetter();
                }, 500);
            } else if (currentSection === 4) {
                // 结尾页面
                setTimeout(() => {
                    showEnding();
                }, 500);
            }
        }
    }
}

// ===== 祝福文字动画 =====
function showBlessingText() {
    const title = document.getElementById('blessing-title');
    const text = document.getElementById('blessing-text');
    
    const titleText = '爸爸，生日快乐。';
    const textContent = '谢谢你一直陪伴在我们身边。';
    
    // 逐字显示标题
    typeWriter(title, titleText, () => {
        title.classList.add('show');
        
        // 停顿1秒后显示第二行
        setTimeout(() => {
            typeWriter(text, textContent, () => {
                text.classList.add('show');
                
                // 3秒后自动切换到下一部分
                setTimeout(() => {
                    switchToNextSection();
                }, 3000);
            });
        }, 1000);
    });
}

function typeWriter(element, text, callback) {
    element.textContent = '';
    let index = 0;
    
    const type = () => {
        if (index < text.length) {
            const char = text[index];
            const span = document.createElement('span');
            span.textContent = char;
            span.classList.add('char');
            element.appendChild(span);
            
            index++;
            setTimeout(type, 50); // 每个字符间隔50ms
        } else {
            if (callback) callback();
        }
    };
    
    type();
}

// ===== 回忆相册动画 =====
function showMemories() {
    const memoryItems = document.querySelectorAll('.memory-item');
    const memoriesContainer = document.querySelector('.memories-container');
    
    // 所有照片同时淡入显示，但有轻微的时间差，营造层次感
    memoryItems.forEach((item, index) => {
        setTimeout(() => {
            item.classList.add('visible');
        }, index * 150); // 每张照片间隔150ms显示
    });
    
    // 添加点击事件监听
    memoryItems.forEach(item => {
        const photo = item.querySelector('.memory-photo');
        const text = item.querySelector('.memory-text');
        
        // 点击照片或文字都可以放大
        [photo, text].forEach(element => {
            if (element) {
                element.addEventListener('click', (e) => {
                    e.stopPropagation();
                    toggleMemoryItem(item, memoriesContainer);
                });
            }
        });
    });
    
    // 点击背景遮罩关闭放大
    if (memoriesContainer) {
        // 使用事件委托，点击遮罩层关闭
        memoriesContainer.addEventListener('click', (e) => {
            // 如果点击的不是memory-item或其子元素，且当前有激活项，则关闭
            const clickedItem = e.target.closest('.memory-item');
            const clickedPhoto = e.target.closest('.memory-photo');
            const clickedText = e.target.closest('.memory-text');
            
            // 如果点击的是背景（不是照片或文字），则关闭
            if (!clickedItem && !clickedPhoto && !clickedText && memoriesContainer.classList.contains('has-active')) {
                closeAllMemoryItems(memoriesContainer);
            }
        });
    }
    
    // ESC键关闭
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeAllMemoryItems(memoriesContainer);
        }
    });
}

// ===== 切换照片放大状态 =====
function toggleMemoryItem(item, container) {
    const isActive = item.classList.contains('active');
    
    if (isActive) {
        // 如果已激活，则关闭
        closeAllMemoryItems(container);
    } else {
        // 关闭其他已激活的项目
        const activeItems = container.querySelectorAll('.memory-item.active');
        activeItems.forEach(activeItem => {
            activeItem.classList.remove('active');
        });
        
        // 激活当前项目
        setTimeout(() => {
            item.classList.add('active');
            container.classList.add('has-active');
        }, 50); // 短暂延迟确保动画流畅
    }
}

// ===== 关闭所有照片放大 =====
function closeAllMemoryItems(container) {
    if (!container) return;
    
    const activeItems = container.querySelectorAll('.memory-item.active');
    activeItems.forEach(item => {
        item.classList.remove('active');
    });
    
    container.classList.remove('has-active');
}

// ===== 信件页面动画 =====
function showLetter() {
    const title = document.querySelector('.letter-title');
    const content = document.querySelector('.letter-content');
    
    setTimeout(() => {
        title.classList.add('show');
    }, 200);
    
    setTimeout(() => {
        content.classList.add('show');
    }, 700);
}

// ===== 结尾页面动画 =====
function showEnding() {
    const texts = document.querySelectorAll('.ending-text, .ending-text-main, .ending-footer');
    
    texts.forEach((text, index) => {
        setTimeout(() => {
            text.classList.add('show');
        }, index * 500);
    });
}

// ===== 滚动到下一部分 =====
function scrollToNextSection() {
    if (currentSection + 1 < sections.length) {
        setTimeout(() => {
            const nextSection = document.getElementById(sections[currentSection + 1]);
            if (nextSection) {
                nextSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 500);
    }
}

// ===== 滚动监听 =====
function initScrollListeners() {
    // 平滑滚动行为
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
}

// ===== 初始化3D蛋糕鼠标跟随效果 =====
function initCake3DEffect() {
    const cakeElement = document.querySelector('.cake');
    const cakeSection = document.getElementById('cake-section');
    
    if (!cakeElement || !cakeSection) return;
    
    // 如果是移动设备，不启用3D效果
    if (isMobileDevice()) {
        cakeElement.classList.add('has-float-animation');
        return;
    }
    
    let mouseX = 0;
    let mouseY = 0;
    let targetRotateX = 0;
    let targetRotateY = 0;
    let currentRotateX = 0;
    let currentRotateY = 0;
    
    // 获取蛋糕容器的中心点
    const getCakeCenter = () => {
        const rect = cakeSection.getBoundingClientRect();
        return {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2
        };
    };
    
    // 鼠标移动事件
    const handleMouseMove = (e) => {
        const center = getCakeCenter();
        const deltaX = e.clientX - center.x;
        const deltaY = e.clientY - center.y;
        
        // 计算旋转角度（限制在合理范围内）
        // 水平旋转（rotateY）：鼠标左右移动
        targetRotateY = (deltaX / window.innerWidth) * 30; // 最大30度
        // 垂直旋转（rotateX）：鼠标上下移动（反向，因为向上应该是向后倾斜）
        targetRotateX = -(deltaY / window.innerHeight) * 20; // 最大20度
    };
    
    // 鼠标离开区域时，恢复初始状态
    const handleMouseLeave = () => {
        targetRotateX = 0;
        targetRotateY = 0;
    };
    
    // 平滑动画函数
    const animate = () => {
        // 使用缓动函数实现平滑过渡
        const easing = 0.15;
        currentRotateX += (targetRotateX - currentRotateX) * easing;
        currentRotateY += (targetRotateY - currentRotateY) * easing;
        
        // 添加轻微的浮动效果
        const floatY = Math.sin(Date.now() / 2000) * 5;
        
        // 应用3D变换
        cakeElement.style.transform = `
            translateY(${floatY}px)
            rotateX(${currentRotateX}deg)
            rotateY(${currentRotateY}deg)
            perspective(1000px)
        `;
        
        requestAnimationFrame(animate);
    };
    
    // 绑定事件
    cakeSection.addEventListener('mousemove', handleMouseMove);
    cakeSection.addEventListener('mouseleave', handleMouseLeave);
    
    // 开始动画循环
    animate();
    
    // 窗口大小改变时重新计算
    window.addEventListener('resize', () => {
        // 重置位置
        targetRotateX = 0;
        targetRotateY = 0;
    });
}

// ===== 音乐控制 =====
function playMusic() {
    if (bgMusic && !musicPlaying) {
        // 检查音乐文件是否存在
        bgMusic.addEventListener('error', () => {
            console.log('音乐文件未找到，跳过播放');
            if (musicToggle) {
                musicToggle.style.display = 'none';
            }
        }, { once: true });
        
        bgMusic.volume = 0.3; // 设置音量为30%
        bgMusic.play().catch(err => {
            console.log('音乐播放失败，可能需要用户交互:', err);
            // 如果播放失败，隐藏音乐按钮
            if (musicToggle && err.name !== 'NotAllowedError') {
                musicToggle.style.display = 'none';
            }
        });
        musicPlaying = true;
        updateMusicButton();
    }
}

function toggleMusic() {
    if (musicPlaying) {
        // 停止音乐
        if (bgMusic && !bgMusic.paused) {
            bgMusic.pause();
        }
        if (window.birthdayAudioSource) {
            try {
                window.birthdayAudioSource.stop();
            } catch (e) {
                console.log('停止音频源失败:', e);
            }
            window.birthdayAudioSource = null;
        }
        if (window.birthdayAudioElement && !window.birthdayAudioElement.paused) {
            window.birthdayAudioElement.pause();
        }
        if (window.onlineMusic && !window.onlineMusic.paused) {
            window.onlineMusic.pause();
        }
        musicPlaying = false;
    } else {
        // 播放音乐
        if (bgMusic && bgMusic.readyState >= 2) {
            bgMusic.play().catch(err => {
                console.log('音乐播放失败:', err);
            });
            musicPlaying = true;
        } else if (window.birthdayAudioElement) {
            // 使用已有的 Audio 元素
            window.birthdayAudioElement.play().then(() => {
                musicPlaying = true;
                updateMusicButton();
            }).catch(err => {
                console.log('Audio元素播放失败:', err);
            });
        } else if (window.birthdayAudioSource) {
            // 重新生成生日歌
            if (isMobileDevice()) {
                useAudioElementBirthdaySong();
            } else {
                generateBirthdaySong();
            }
        } else {
            // 尝试播放或生成
            attemptPlayMusic();
            if (!musicPlaying) {
                if (isMobileDevice()) {
                    useAudioElementBirthdaySong();
                } else {
                    generateBirthdaySong();
                }
            }
        }
    }
    
    updateMusicButton();
}

function updateMusicButton() {
    if (musicToggle) {
        musicToggle.textContent = musicPlaying ? '🔊' : '🔇';
    }
}

// ===== 页面加载完成后的初始化 =====
window.addEventListener('load', () => {
    // 确保第一个页面可见
    const firstSection = document.getElementById(sections[0]);
    if (firstSection) {
        firstSection.classList.add('active');
    }
    
    // 尝试自动播放音乐
    tryAutoPlayMusic();
});

// ===== 自动播放音乐 =====
function tryAutoPlayMusic() {
    if (!bgMusic) return;
    
    // 设置音乐属性
    bgMusic.volume = 0.3;
    bgMusic.loop = true;
    
    // 检查音乐文件是否存在
    bgMusic.addEventListener('error', () => {
        console.log('音乐文件未找到，使用生成的生日歌');
        // 如果文件不存在，生成简单的生日歌
        generateBirthdaySong();
    }, { once: true });
    
    // 检查音乐是否可以加载
    bgMusic.addEventListener('canplay', () => {
        // 文件存在，尝试播放
        attemptPlayMusic();
    }, { once: true });
    
    // 尝试加载音乐文件
    bgMusic.load();
    
    // 如果3秒后还没加载成功，使用生成的生日歌
    setTimeout(() => {
        if (!musicPlaying && bgMusic.readyState < 2) {
            console.log('音乐加载超时，使用生成的生日歌');
            generateBirthdaySong();
        }
    }, 3000);
}

// ===== 尝试播放音乐 =====
function attemptPlayMusic() {
    if (!bgMusic || musicPlaying) return;
    
    const playPromise = bgMusic.play();
    
    if (playPromise !== undefined) {
        playPromise
            .then(() => {
                // 播放成功
                musicPlaying = true;
                updateMusicButton();
                console.log('音乐播放成功');
            })
            .catch(error => {
                // 播放失败（通常是浏览器限制）
                console.log('自动播放被阻止，等待用户交互:', error);
                // 添加点击页面任意位置播放的功能
                addClickToPlay();
            });
    }
}

// ===== 添加点击播放功能 =====
function addClickToPlay() {
    let hasPlayed = false;
    
    const playOnInteraction = () => {
        if (!hasPlayed && !musicPlaying) {
            if (bgMusic && bgMusic.readyState >= 2) {
                // 如果有音乐文件，播放它
                bgMusic.play()
                    .then(() => {
                        musicPlaying = true;
                        updateMusicButton();
                        hasPlayed = true;
                        document.removeEventListener('click', playOnInteraction);
                        document.removeEventListener('touchstart', playOnInteraction);
                    })
                    .catch(err => {
                        console.log('播放失败:', err);
                    });
            } else {
                // 否则生成生日歌（移动设备使用更兼容的方式）
                if (isMobileDevice()) {
                    useAudioElementBirthdaySong();
                } else {
                    generateBirthdaySong();
                }
                hasPlayed = true;
                document.removeEventListener('click', playOnInteraction);
                document.removeEventListener('touchstart', playOnInteraction);
            }
        }
    };
    
    // 监听点击和触摸事件
    document.addEventListener('click', playOnInteraction, { once: true });
    document.addEventListener('touchstart', playOnInteraction, { once: true });
}

// ===== 初始化音频上下文（移动设备需要用户交互） =====
function initAudioContext() {
    if (window.birthdayAudioContext && window.birthdayAudioContext.state !== 'closed') {
        // 如果上下文已存在且未关闭，尝试恢复
        if (window.birthdayAudioContext.state === 'suspended') {
            window.birthdayAudioContext.resume();
        }
        return window.birthdayAudioContext;
    }
    
    try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) {
            throw new Error('AudioContext not supported');
        }
        
        const audioContext = new AudioContextClass();
        window.birthdayAudioContext = audioContext;
        audioContextInitialized = true;
        
        // 移动设备上，确保上下文是 running 状态
        if (audioContext.state === 'suspended') {
            audioContext.resume().then(() => {
                console.log('音频上下文已恢复');
            }).catch(err => {
                console.log('恢复音频上下文失败:', err);
            });
        }
        
        return audioContext;
    } catch (error) {
        console.log('创建音频上下文失败:', error);
        return null;
    }
}

// ===== 生成简单的生日歌 =====
function generateBirthdaySong() {
    try {
        // 初始化音频上下文
        const audioContext = initAudioContext();
        if (!audioContext) {
            throw new Error('无法创建音频上下文');
        }
        
        // 确保音频上下文是运行状态（移动设备需要）
        if (audioContext.state === 'suspended') {
            audioContext.resume().then(() => {
                console.log('音频上下文已恢复，继续生成生日歌');
                generateBirthdaySong();
            }).catch(err => {
                console.log('恢复音频上下文失败:', err);
                // 如果恢复失败，尝试使用 Audio 元素
                useAudioElementBirthdaySong();
            });
            return;
        }
        
        // 生日快乐歌的音符频率 (C大调)
        const notes = {
            'C': 261.63,  // Do
            'D': 293.66,  // Re
            'E': 329.63,  // Mi
            'F': 349.23,  // Fa
            'G': 392.00,  // Sol
            'A': 440.00,  // La
            'A#': 466.16, // 降Si
            'B': 493.88,  // Si
            'C2': 523.25  // 高音Do
        };
        
        // 生日快乐歌的旋律
        const melody = [
            { note: 'C', duration: 0.3 },
            { note: 'C', duration: 0.15 },
            { note: 'D', duration: 0.4 },
            { note: 'C', duration: 0.4 },
            { note: 'F', duration: 0.4 },
            { note: 'E', duration: 0.6 },
            { note: 'C', duration: 0.3 },
            { note: 'C', duration: 0.15 },
            { note: 'D', duration: 0.4 },
            { note: 'C', duration: 0.4 },
            { note: 'G', duration: 0.4 },
            { note: 'F', duration: 0.6 },
            { note: 'C', duration: 0.3 },
            { note: 'C', duration: 0.15 },
            { note: 'C2', duration: 0.4 },
            { note: 'A', duration: 0.4 },
            { note: 'F', duration: 0.4 },
            { note: 'E', duration: 0.4 },
            { note: 'D', duration: 0.6 },
            { note: 'A#', duration: 0.3 },
            { note: 'A#', duration: 0.15 },
            { note: 'A', duration: 0.4 },
            { note: 'F', duration: 0.4 },
            { note: 'G', duration: 0.4 },
            { note: 'F', duration: 0.8 }
        ];
        
        // 创建音频缓冲区
        const sampleRate = audioContext.sampleRate;
        const duration = melody.reduce((sum, m) => sum + m.duration, 0);
        const buffer = audioContext.createBuffer(2, sampleRate * duration, sampleRate);
        
        // 生成音频数据
        let timeOffset = 0;
        melody.forEach(({ note, duration }) => {
            const frequency = notes[note] || notes['C'];
            const samples = Math.floor(duration * sampleRate);
            const noteStartTime = timeOffset / sampleRate;
            
            for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
                const channelData = buffer.getChannelData(channel);
                
                for (let i = 0; i < samples && (timeOffset + i) < buffer.length; i++) {
                    const t = (timeOffset + i) / sampleRate - noteStartTime;
                    // 使用正弦波生成音调，添加包络避免爆音
                    const attackTime = 0.05;
                    const releaseTime = 0.1;
                    let envelope = 1;
                    if (t < attackTime) {
                        envelope = t / attackTime;
                    } else if (t > duration - releaseTime) {
                        envelope = (duration - t) / releaseTime;
                    }
                    channelData[timeOffset + i] = Math.sin(2 * Math.PI * frequency * t) * 0.25 * envelope;
                }
            }
            
            timeOffset += samples;
        });
        
        // 创建音频源并播放
        const source = audioContext.createBufferSource();
        source.buffer = buffer;
        source.loop = true;
        source.connect(audioContext.destination);
        
        // 确保在用户交互后才播放（移动设备要求）
        try {
            source.start(0);
            window.birthdayAudioSource = source;
            musicPlaying = true;
            updateMusicButton();
            console.log('生日歌生成并播放成功');
        } catch (error) {
            console.log('播放失败，尝试恢复上下文:', error);
            // 如果播放失败，尝试恢复上下文
            if (audioContext.state === 'suspended') {
                audioContext.resume().then(() => {
                    try {
                        source.start(0);
                        window.birthdayAudioSource = source;
                        musicPlaying = true;
                        updateMusicButton();
                    } catch (e) {
                        console.log('恢复后仍无法播放:', e);
                        useAudioElementBirthdaySong();
                    }
                });
            } else {
                useAudioElementBirthdaySong();
            }
        }
        
    } catch (error) {
        console.log('无法生成生日歌:', error);
        // 如果生成失败，尝试使用 Audio 元素（移动设备更兼容）
        useAudioElementBirthdaySong();
    }
}

// ===== 使用 Audio 元素生成生日歌（移动设备更兼容） =====
function useAudioElementBirthdaySong() {
    try {
        // 创建一个隐藏的 Audio 元素
        const audio = new Audio();
        audio.volume = 0.3;
        audio.loop = true;
        
        // 使用 Data URL 方式生成音频（更兼容移动设备）
        // 这里我们使用一个简化的方法：创建多个短音频片段并循环
        createAudioElementSong(audio);
        
        audio.addEventListener('canplay', () => {
            audio.play().then(() => {
                window.birthdayAudioElement = audio;
                musicPlaying = true;
                updateMusicButton();
                console.log('Audio元素生日歌播放成功');
            }).catch(err => {
                console.log('Audio元素播放失败:', err);
            });
        });
        
        audio.addEventListener('error', () => {
            console.log('Audio元素加载失败');
            // 最后尝试使用在线资源
            useOnlineBirthdaySong();
        });
        
    } catch (error) {
        console.log('创建Audio元素失败:', error);
        useOnlineBirthdaySong();
    }
}

// ===== 创建 Audio 元素的生日歌 =====
function createAudioElementSong(audioElement) {
    // 使用 Web Audio API 生成音频数据，然后转换为 Blob URL
    try {
        const audioContext = initAudioContext();
        if (!audioContext) {
            throw new Error('无法创建音频上下文');
        }
        
        // 确保音频上下文是运行状态
        const ensureContextRunning = () => {
            if (audioContext.state === 'suspended') {
                return audioContext.resume().then(() => {
                    return createAudioBuffer(audioContext);
                });
            }
            return Promise.resolve(createAudioBuffer(audioContext));
        };
        
        ensureContextRunning().then(buffer => {
            const wav = audioBufferToWav(buffer);
            const blob = new Blob([wav], { type: 'audio/wav' });
            const url = URL.createObjectURL(blob);
            audioElement.src = url;
        }).catch(error => {
            console.log('创建音频失败:', error);
            // 如果失败，尝试使用在线资源
            useOnlineBirthdaySong();
        });
        
    } catch (error) {
        console.log('创建Audio元素歌曲失败:', error);
        useOnlineBirthdaySong();
    }
}

// ===== 创建音频缓冲区 =====
function createAudioBuffer(audioContext) {
        
    const notes = {
        'C': 261.63, 'D': 293.66, 'E': 329.63, 'F': 349.23,
        'G': 392.00, 'A': 440.00, 'A#': 466.16, 'B': 493.88, 'C2': 523.25
    };
    
    const melody = [
        { note: 'C', duration: 0.3 }, { note: 'C', duration: 0.15 }, { note: 'D', duration: 0.4 },
        { note: 'C', duration: 0.4 }, { note: 'F', duration: 0.4 }, { note: 'E', duration: 0.6 },
        { note: 'C', duration: 0.3 }, { note: 'C', duration: 0.15 }, { note: 'D', duration: 0.4 },
        { note: 'C', duration: 0.4 }, { note: 'G', duration: 0.4 }, { note: 'F', duration: 0.6 },
        { note: 'C', duration: 0.3 }, { note: 'C', duration: 0.15 }, { note: 'C2', duration: 0.4 },
        { note: 'A', duration: 0.4 }, { note: 'F', duration: 0.4 }, { note: 'E', duration: 0.4 },
        { note: 'D', duration: 0.6 }, { note: 'A#', duration: 0.3 }, { note: 'A#', duration: 0.15 },
        { note: 'A', duration: 0.4 }, { note: 'F', duration: 0.4 }, { note: 'G', duration: 0.4 },
        { note: 'F', duration: 0.8 }
    ];
    
    const sampleRate = audioContext.sampleRate;
    const duration = melody.reduce((sum, m) => sum + m.duration, 0);
    const buffer = audioContext.createBuffer(2, sampleRate * duration, sampleRate);
    
    let timeOffset = 0;
    melody.forEach(({ note, duration }) => {
        const frequency = notes[note] || notes['C'];
        const samples = Math.floor(duration * sampleRate);
        const noteStartTime = timeOffset / sampleRate;
        
        for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
            const channelData = buffer.getChannelData(channel);
            for (let i = 0; i < samples && (timeOffset + i) < buffer.length; i++) {
                const t = (timeOffset + i) / sampleRate - noteStartTime;
                const attackTime = 0.05;
                const releaseTime = 0.1;
                let envelope = 1;
                if (t < attackTime) {
                    envelope = t / attackTime;
                } else if (t > duration - releaseTime) {
                    envelope = (duration - t) / releaseTime;
                }
                channelData[timeOffset + i] = Math.sin(2 * Math.PI * frequency * t) * 0.25 * envelope;
            }
        }
        timeOffset += samples;
    });
    
    return buffer;
}

// ===== 将 AudioBuffer 转换为 WAV =====
function audioBufferToWav(buffer) {
    const length = buffer.length;
    const numberOfChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const arrayBuffer = new ArrayBuffer(44 + length * numberOfChannels * 2);
    const view = new DataView(arrayBuffer);
    const channels = [];
    let offset = 0;
    let pos = 0;
    
    // WAV 文件头
    const setUint16 = (data) => {
        view.setUint16(pos, data, true);
        pos += 2;
    };
    const setUint32 = (data) => {
        view.setUint32(pos, data, true);
        pos += 4;
    };
    
    // RIFF 标识
    setUint32(0x46464952); // "RIFF"
    setUint32(length * numberOfChannels * 2 + 36); // 文件大小
    setUint32(0x45564157); // "WAVE"
    setUint32(0x20746d66); // "fmt "
    setUint32(16); // 格式块大小
    setUint16(1); // PCM 格式
    setUint16(numberOfChannels); // 声道数
    setUint32(sampleRate); // 采样率
    setUint32(sampleRate * numberOfChannels * 2); // 字节率
    setUint16(numberOfChannels * 2); // 块对齐
    setUint16(16); // 位深度
    setUint32(0x61746164); // "data"
    setUint32(length * numberOfChannels * 2); // 数据大小
    
    // 写入音频数据
    for (let i = 0; i < numberOfChannels; i++) {
        channels.push(buffer.getChannelData(i));
    }
    
    while (pos < arrayBuffer.byteLength) {
        for (let i = 0; i < numberOfChannels; i++) {
            let sample = Math.max(-1, Math.min(1, channels[i][offset]));
            sample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
            view.setInt16(pos, sample, true);
            pos += 2;
        }
        offset++;
    }
    
    return arrayBuffer;
}

// ===== 使用在线生日歌资源 =====
function useOnlineBirthdaySong() {
    // 创建一个新的audio元素使用在线资源
    const onlineMusic = new Audio();
    onlineMusic.volume = 0.3;
    onlineMusic.loop = true;
    
    // 使用一个公开的生日歌资源（如果可用）
    // 注意：这里使用一个简单的midi转mp3的在线资源
    onlineMusic.src = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';
    
    onlineMusic.addEventListener('canplay', () => {
        onlineMusic.play()
            .then(() => {
                musicPlaying = true;
                updateMusicButton();
                window.onlineMusic = onlineMusic;
                console.log('在线生日歌播放成功');
            })
            .catch(err => {
                console.log('在线音乐播放失败:', err);
            });
    });
    
    onlineMusic.addEventListener('error', () => {
        console.log('无法加载在线音乐');
    });
    
    onlineMusic.load();
}

// ===== 平滑滚动增强 =====
document.documentElement.style.scrollBehavior = 'smooth';

// ===== 打开信件 =====
function openLetter() {
    const letterModal = document.getElementById('letter-modal');
    const letterContent = document.getElementById('letter-content-dynamic');
    
    if (!letterModal || !letterContent) return;
    
    // 初始化打字机音效
    initTypewriterSound();
    
    // 显示弹窗
    letterModal.classList.add('show');
    document.body.style.overflow = 'hidden';
    
    // 清空内容
    letterContent.innerHTML = '';
    
    // 信件内容
    const letterText = [
        '我或许不是个合格的女儿',
        '但你是位合格的父亲',
        '爸爸 祝你生日快乐',
        '愿岁月温柔以待你和妈咪',
        '愿我能赶上你们的步伐',
        '愿爱 无须多言 也能跨越千山万水'
    ];
    
    // 逐行显示
    showLetterLines(letterContent, letterText, 0);
}

// ===== 逐行显示信件内容 =====
function showLetterLines(container, lines, index) {
    if (index >= lines.length) {
        // 所有文字显示完成后，显示爱心按钮
        setTimeout(() => {
            showHeartButton();
        }, 800);
        return;
    }
    
    const line = document.createElement('div');
    line.className = 'letter-line';
    container.appendChild(line);
    
    // 逐字显示
    typeLetterLine(line, lines[index], () => {
        // 当前行显示完成后，延迟显示下一行
        setTimeout(() => {
            showLetterLines(container, lines, index + 1);
        }, 500);
    });
}

// ===== 显示爱心按钮 =====
function showHeartButton() {
    const heartBtnContainer = document.getElementById('letter-heart-btn-container');
    if (heartBtnContainer) {
        heartBtnContainer.style.display = 'block';
        heartBtnContainer.style.opacity = '0';
        heartBtnContainer.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            heartBtnContainer.style.transition = 'all 0.8s ease';
            heartBtnContainer.style.opacity = '1';
            heartBtnContainer.style.transform = 'translateY(0)';
        }, 100);
        
        // 绑定按钮点击事件
        const heartBtn = document.getElementById('heart-btn');
        if (heartBtn) {
            heartBtn.addEventListener('click', showInteractiveHeart);
        }
    }
}

// ===== 显示交互爱心 =====
function showInteractiveHeart() {
    const interactiveHeart = document.getElementById('interactive-heart');
    if (!interactiveHeart) return;
    
    // 隐藏按钮
    const heartBtnContainer = document.getElementById('letter-heart-btn-container');
    if (heartBtnContainer) {
        heartBtnContainer.style.opacity = '0';
        heartBtnContainer.style.transform = 'translateY(20px)';
        setTimeout(() => {
            heartBtnContainer.style.display = 'none';
        }, 500);
    }
    
    // 显示爱心
    interactiveHeart.classList.add('show');
    
    // 创建粒子效果
    createHeartParticles();
    
    // 显示提示文字
    showHeartHint();
    
    // 绑定爱心点击事件
    interactiveHeart.addEventListener('click', handleHeartClick);
    
    // 绑定关闭按钮
    const closeHeartBtn = document.getElementById('close-heart-btn');
    if (closeHeartBtn) {
        closeHeartBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            playButtonClickSound();
            closeInteractiveHeart();
        });
    }
}

// ===== 显示点击提示 =====
function showHeartHint() {
    const interactiveHeart = document.getElementById('interactive-heart');
    if (!interactiveHeart) return;
    
    // 移除之前的提示
    const existingHint = interactiveHeart.querySelector('.heart-hint');
    if (existingHint) {
        existingHint.remove();
    }
    
    const hint = document.createElement('div');
    hint.className = 'heart-hint';
    hint.textContent = '点击爱心';
    interactiveHeart.appendChild(hint);
    
    setTimeout(() => {
        hint.style.opacity = '1';
        hint.style.transform = 'translateY(0)';
    }, 300);
}

// ===== 祝福语数组 =====
const heartMessages = [
    '谢谢你 爸爸',
    '我爱你',
    '爸爸 你辛苦了',
    '谢谢你一直陪伴我',
    '爸爸 生日快乐',
    '我爱你 爸爸',
    '谢谢你为我做的一切',
    '爸爸 你是我心中的英雄',
    '谢谢你 爸爸 我爱你',
    '爸爸 谢谢你',
    '我爱你 爸爸 永远',
    '谢谢你 爸爸 辛苦了',
    '爸爸 我爱你 谢谢你',
    '谢谢你一直爱我',
    '爸爸 你是我最重要的人'
];

// ===== 处理爱心点击 =====
function handleHeartClick(e) {
    // 如果点击的是关闭按钮，不处理
    if (e.target.closest('.close-heart-btn')) {
        return;
    }
    
    // 只处理点击爱心本身的情况
    const heartMain = document.querySelector('.heart-main');
    const clickedElement = e.target;
    
    if (heartMain && (clickedElement === heartMain || clickedElement.closest('.heart-main'))) {
        // 播放爱心点击音效
        playHeartClickSound();
        
        // 隐藏提示
        const hint = document.querySelector('.heart-hint');
        if (hint) {
            hint.style.opacity = '0';
            hint.style.transform = 'translateY(-10px)';
            setTimeout(() => {
                hint.remove();
            }, 300);
        }
        
        // 爱心跳动动画
        heartMain.style.animation = 'none';
        setTimeout(() => {
            heartMain.style.animation = 'heartBeat 0.6s ease';
        }, 10);
        
        // 创建点击粒子
        createClickParticles(e);
        
        // 随机显示祝福语
        showRandomHeartMessage();
    }
}

// ===== 生成爱心点击音效 =====
function playHeartClickSound() {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // 创建温暖的"咚"声
        const duration = 0.4;
        const sampleRate = audioContext.sampleRate;
        const buffer = audioContext.createBuffer(1, sampleRate * duration, sampleRate);
        const data = buffer.getChannelData(0);
        
        // 生成温暖的音调，频率从低到高再到低
        const baseFreq = 300;
        const peakFreq = 500;
        
        for (let i = 0; i < data.length; i++) {
            const t = i / sampleRate;
            let freq;
            if (t < duration / 2) {
                freq = baseFreq + (peakFreq - baseFreq) * (t * 2 / duration);
            } else {
                freq = peakFreq - (peakFreq - baseFreq) * ((t - duration / 2) * 2 / duration);
            }
            const phase = 2 * Math.PI * freq * t;
            const envelope = Math.exp(-t * 8);
            data[i] = Math.sin(phase) * 0.25 * envelope;
        }
        
        // 添加低频谐波，让声音更温暖
        for (let i = 0; i < data.length; i++) {
            const t = i / sampleRate;
            let freq;
            if (t < duration / 2) {
                freq = baseFreq * 0.5 + (peakFreq * 0.5 - baseFreq * 0.5) * (t * 2 / duration);
            } else {
                freq = peakFreq * 0.5 - (peakFreq * 0.5 - baseFreq * 0.5) * ((t - duration / 2) * 2 / duration);
            }
            const phase = 2 * Math.PI * freq * t;
            const envelope = Math.exp(-t * 6);
            data[i] += Math.sin(phase) * 0.15 * envelope;
        }
        
        const source = audioContext.createBufferSource();
        source.buffer = buffer;
        
        const gainNode = audioContext.createGain();
        gainNode.gain.setValueAtTime(0.35, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
        
        source.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        source.start(0);
        source.stop(audioContext.currentTime + duration);
        
    } catch (error) {
        console.log('无法播放爱心点击音效:', error);
    }
}

// ===== 随机显示祝福语 =====
function showRandomHeartMessage() {
    const interactiveHeart = document.getElementById('interactive-heart');
    if (!interactiveHeart) return;
    
    // 移除之前的消息
    const existingMessage = interactiveHeart.querySelector('.heart-message');
    if (existingMessage) {
        existingMessage.style.opacity = '0';
        existingMessage.style.transform = 'translateX(-50%) translateY(20px)';
        setTimeout(() => {
            existingMessage.remove();
        }, 300);
    }
    
    // 随机选择一条祝福语
    const randomMessage = heartMessages[Math.floor(Math.random() * heartMessages.length)];
    
    const message = document.createElement('div');
    message.className = 'heart-message';
    message.textContent = randomMessage;
    interactiveHeart.appendChild(message);
    
    setTimeout(() => {
        message.style.opacity = '1';
        message.style.transform = 'translateX(-50%) translateY(0)';
    }, 100);
    
    // 2秒后淡出
    setTimeout(() => {
        message.style.opacity = '0';
        message.style.transform = 'translateX(-50%) translateY(-10px)';
        setTimeout(() => {
            message.remove();
            // 如果没有消息了，重新显示提示
            if (!interactiveHeart.querySelector('.heart-message')) {
                showHeartHint();
            }
        }, 300);
    }, 2000);
}

// ===== 创建爱心粒子 =====
function createHeartParticles() {
    const particlesContainer = document.querySelector('.heart-particles');
    if (!particlesContainer) return;
    
    particlesContainer.innerHTML = '';
    
    for (let i = 0; i < 20; i++) {
        const particle = document.createElement('div');
        particle.className = 'heart-particle';
        particle.textContent = ['❤️', '💖', '💕', '💗', '💓'][Math.floor(Math.random() * 5)];
        particle.style.left = '50%';
        particle.style.top = '50%';
        particle.style.animationDelay = `${i * 0.1}s`;
        particlesContainer.appendChild(particle);
    }
}

// ===== 创建点击粒子 =====
function createClickParticles(event) {
    const interactiveHeart = document.getElementById('interactive-heart');
    if (!interactiveHeart) return;
    
    const rect = interactiveHeart.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    const particles = ['✨', '💫', '⭐', '🌟'];
    
    for (let i = 0; i < 8; i++) {
        const particle = document.createElement('div');
        particle.className = 'click-particle';
        particle.textContent = particles[Math.floor(Math.random() * particles.length)];
        particle.style.left = x + 'px';
        particle.style.top = y + 'px';
        particle.style.animationDelay = `${i * 0.05}s`;
        particle.style.setProperty('--random-x', `${(Math.random() - 0.5) * 200}px`);
        interactiveHeart.appendChild(particle);
        
        setTimeout(() => {
            if (particle.parentNode) {
                particle.remove();
            }
        }, 1000);
    }
}


// ===== 关闭交互爱心 =====
function closeInteractiveHeart() {
    const interactiveHeart = document.getElementById('interactive-heart');
    if (!interactiveHeart) return;
    
    interactiveHeart.classList.remove('show');
    
    // 清空内容
    const heartParticles = document.querySelector('.heart-particles');
    if (heartParticles) {
        heartParticles.innerHTML = '';
    }
    
    const message = document.querySelector('.heart-message');
    if (message) {
        message.remove();
    }
    
    const hint = document.querySelector('.heart-hint');
    if (hint) {
        hint.remove();
    }
    
    // 重新显示按钮
    const heartBtnContainer = document.getElementById('letter-heart-btn-container');
    if (heartBtnContainer) {
        heartBtnContainer.style.display = 'block';
        heartBtnContainer.style.opacity = '1';
        heartBtnContainer.style.transform = 'translateY(0)';
    }
}

// ===== 打字机音效相关变量 =====
let typewriterAudioContext = null;
let typewriterBuffer = null;

// ===== 初始化打字机音效 =====
function initTypewriterSound() {
    try {
        // 创建或获取共享的 AudioContext
        if (!typewriterAudioContext) {
            typewriterAudioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        
        // 如果上下文被暂停，尝试恢复
        if (typewriterAudioContext.state === 'suspended') {
            typewriterAudioContext.resume().catch(err => {
                console.log('恢复打字机音效上下文失败:', err);
            });
        }
        
        // 预生成音频缓冲区（只生成一次）
        if (!typewriterBuffer) {
            const duration = 0.08; // 短促的音效
            const sampleRate = typewriterAudioContext.sampleRate;
            typewriterBuffer = typewriterAudioContext.createBuffer(1, sampleRate * duration, sampleRate);
            const data = typewriterBuffer.getChannelData(0);
            
            // 生成短促的点击声，带有轻微的高频成分
            for (let i = 0; i < data.length; i++) {
                const t = i / sampleRate;
                // 主频率（中频）
                const freq1 = 800;
                const phase1 = 2 * Math.PI * freq1 * t;
                // 高频成分（模拟打字机的机械声）
                const freq2 = 2000;
                const phase2 = 2 * Math.PI * freq2 * t;
                // 快速衰减的包络
                const envelope = Math.exp(-t * 40);
                // 组合两个频率
                data[i] = (Math.sin(phase1) * 0.15 + Math.sin(phase2) * 0.1) * envelope;
            }
        }
    } catch (error) {
        console.log('初始化打字机音效失败:', error);
    }
}

// ===== 生成打字机音效 =====
function playTypewriterSound() {
    try {
        // 确保音效已初始化
        if (!typewriterAudioContext || !typewriterBuffer) {
            initTypewriterSound();
        }
        
        // 如果初始化失败，直接返回
        if (!typewriterAudioContext || !typewriterBuffer) {
            return;
        }
        
        // 确保上下文是运行状态
        if (typewriterAudioContext.state === 'suspended') {
            typewriterAudioContext.resume().catch(err => {
                console.log('恢复打字机音效上下文失败:', err);
            });
        }
        
        // 创建新的音频源（可以同时播放多个）
        const source = typewriterAudioContext.createBufferSource();
        source.buffer = typewriterBuffer;
        
        const gainNode = typewriterAudioContext.createGain();
        gainNode.gain.setValueAtTime(0.25, typewriterAudioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, typewriterAudioContext.currentTime + 0.08);
        
        source.connect(gainNode);
        gainNode.connect(typewriterAudioContext.destination);
        
        source.start(0);
        source.stop(typewriterAudioContext.currentTime + 0.08);
        
    } catch (error) {
        console.log('无法播放打字机音效:', error);
    }
}

// ===== 逐字显示信件行 =====
function typeLetterLine(element, text, callback) {
    let index = 0;
    
    const type = () => {
        if (index < text.length) {
            const char = text[index];
            const span = document.createElement('span');
            span.className = 'letter-char';
            span.textContent = char;
            element.appendChild(span);
            
            // 每个字符都播放打字音效
            playTypewriterSound();
            
            index++;
            setTimeout(type, 80); // 每个字符间隔80ms
        } else {
            if (callback) callback();
        }
    };
    
    type();
}

// ===== 关闭信件 =====
function closeLetter() {
    const letterModal = document.getElementById('letter-modal');
    
    if (!letterModal) return;
    
    letterModal.classList.remove('show');
    document.body.style.overflow = '';
    
    // 清空内容
    const letterContent = document.getElementById('letter-content-dynamic');
    if (letterContent) {
        letterContent.innerHTML = '';
    }
}