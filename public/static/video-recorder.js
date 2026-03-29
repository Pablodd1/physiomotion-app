// Video Recording Module for PhysioMotion
// Handles actual video capture, storage, and upload

const VideoRecorder = {
    mediaRecorder: null,
    recordedChunks: [],
    stream: null,
    isRecording: false,
    recordingStartTime: null,
    recordingTimer: null,
    
    // Initialize video recording capabilities
    async initialize(videoElement) {
        try {
            // Get video stream from the video element's srcObject
            if (!videoElement || !videoElement.srcObject) {
                console.error('No video stream available');
                return false;
            }
            
            this.stream = videoElement.srcObject;
            
            // Check for supported MIME types
            const mimeTypes = [
                'video/webm;codecs=vp9,opus',
                'video/webm;codecs=vp8,opus',
                'video/webm',
                'video/mp4'
            ];
            
            let selectedMimeType = '';
            for (const type of mimeTypes) {
                if (MediaRecorder.isTypeSupported(type)) {
                    selectedMimeType = type;
                    console.log('✅ Video recording supported:', type);
                    break;
                }
            }
            
            if (!selectedMimeType) {
                console.warn('⚠️ No supported video MIME type found');
                return false;
            }
            
            // Create MediaRecorder
            this.mediaRecorder = new MediaRecorder(this.stream, {
                mimeType: selectedMimeType,
                videoBitsPerSecond: 2500000 // 2.5 Mbps for good quality
            });
            
            // Handle data available
            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data && event.data.size > 0) {
                    this.recordedChunks.push(event.data);
                }
            };
            
            // Handle recording stop
            this.mediaRecorder.onstop = () => {
                console.log('✅ Video recording stopped');
            };
            
            // Handle errors
            this.mediaRecorder.onerror = (error) => {
                console.error('❌ MediaRecorder error:', error);
                showNotification('Video recording error: ' + error.message, 'error');
            };
            
            return true;
        } catch (error) {
            console.error('❌ Video recorder initialization error:', error);
            return false;
        }
    },
    
    // Start recording
    startRecording() {
        if (!this.mediaRecorder) {
            showNotification('Video recorder not initialized', 'error');
            return false;
        }
        
        if (this.mediaRecorder.state === 'recording') {
            console.warn('Already recording');
            return false;
        }
        
        // Clear previous recording
        this.recordedChunks = [];
        this.isRecording = true;
        this.recordingStartTime = Date.now();
        
        // Start recording with 1-second chunks for resilience
        this.mediaRecorder.start(1000);
        
        console.log('🎥 Video recording started');
        
        // Update recording timer display
        this.recordingTimer = setInterval(() => {
            const elapsed = Math.floor((Date.now() - this.recordingStartTime) / 1000);
            const mins = Math.floor(elapsed / 60).toString().padStart(2, '0');
            const secs = (elapsed % 60).toString().padStart(2, '0');
            
            const timerElement = document.getElementById('recordingTime');
            if (timerElement) {
                timerElement.textContent = `${mins}:${secs}`;
            }
        }, 1000);
        
        return true;
    },
    
    // Stop recording
    stopRecording() {
        if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
            return null;
        }
        
        this.isRecording = false;
        
        // Stop timer
        if (this.recordingTimer) {
            clearInterval(this.recordingTimer);
            this.recordingTimer = null;
        }
        
        // Stop recorder
        this.mediaRecorder.stop();
        
        // Calculate duration
        const duration = this.recordingStartTime 
            ? Math.floor((Date.now() - this.recordingStartTime) / 1000)
            : 0;
        
        console.log(`🎥 Recording stopped. Duration: ${duration}s, Chunks: ${this.recordedChunks.length}`);
        
        return {
            duration: duration,
            chunks: this.recordedChunks.length
        };
    },
    
    // Get recorded video as Blob
    getRecordedBlob() {
        if (this.recordedChunks.length === 0) {
            return null;
        }
        
        const blob = new Blob(this.recordedChunks, { 
            type: this.mediaRecorder.mimeType || 'video/webm' 
        });
        
        return blob;
    },
    
    // Get video as File object for upload
    getRecordedFile(filename = 'assessment-video.webm') {
        const blob = this.getRecordedBlob();
        if (!blob) return null;
        
        // Determine extension based on MIME type
        let extension = 'webm';
        if (blob.type.includes('mp4')) extension = 'mp4';
        
        const finalFilename = filename.replace(/\.[^/.]+$/, `.${extension}`);
        
        return new File([blob], finalFilename, { 
            type: blob.type,
            lastModified: Date.now()
        });
    },
    
    // Upload video to server
    async uploadVideo(patientId, assessmentId, options = {}) {
        const file = this.getRecordedFile(options.filename || `assessment-${Date.now()}.webm`);
        if (!file) {
            showNotification('No video recorded', 'error');
            return null;
        }
        
        const formData = new FormData();
        formData.append('video', file);
        formData.append('patient_id', patientId.toString());
        formData.append('video_type', options.videoType || 'assessment');
        formData.append('title', options.title || `Assessment ${new Date().toLocaleString()}`);
        formData.append('description', options.description || '');
        
        if (assessmentId) {
            formData.append('assessment_id', assessmentId.toString());
        }
        
        try {
            showNotification('Uploading video...', 'info');
            
            const response = await fetch('/api/videos/upload', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                },
                body: formData
            });
            
            const result = await response.json();
            
            if (result.success) {
                showNotification('Video uploaded successfully!', 'success');
                return result.data;
            } else {
                throw new Error(result.error || 'Upload failed');
            }
        } catch (error) {
            console.error('❌ Video upload error:', error);
            showNotification('Video upload failed: ' + error.message, 'error');
            return null;
        }
    },
    
    // Preview recorded video
    previewRecording(videoElement) {
        const blob = this.getRecordedBlob();
        if (!blob || !videoElement) return false;
        
        const url = URL.createObjectURL(blob);
        videoElement.src = url;
        videoElement.play();
        
        return url; // Return URL so it can be revoked later
    },
    
    // Download recorded video locally
    downloadRecording(filename = 'physio-recording.webm') {
        const blob = this.getRecordedBlob();
        if (!blob) {
            showNotification('No video to download', 'error');
            return false;
        }
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        // Cleanup
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        
        return true;
    },
    
    // Reset recorder
    reset() {
        this.recordedChunks = [];
        this.isRecording = false;
        this.recordingStartTime = null;
        
        if (this.recordingTimer) {
            clearInterval(this.recordingTimer);
            this.recordingTimer = null;
        }
        
        if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
            this.mediaRecorder.stop();
        }
    },
    
    // Get recording stats
    getStats() {
        const blob = this.getRecordedBlob();
        return {
            isRecording: this.isRecording,
            duration: this.recordingStartTime 
                ? Math.floor((Date.now() - this.recordingStartTime) / 1000)
                : 0,
            chunks: this.recordedChunks.length,
            size: blob ? blob.size : 0,
            sizeFormatted: blob ? this.formatBytes(blob.size) : '0 B'
        };
    },
    
    // Format bytes to human readable
    formatBytes(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
};

// Integration with existing assessment workflow
async function startRecordingWithVideo() {
    // Initialize video recorder if not already done
    const videoElement = document.getElementById('videoElement');
    
    if (!VideoRecorder.mediaRecorder) {
        const initialized = await VideoRecorder.initialize(videoElement);
        if (!initialized) {
            showNotification('Video recording not supported in this browser', 'warning');
            // Continue with skeleton-only recording
        }
    }
    
    // Start skeleton recording (existing)
    ASSESSMENT_STATE.isRecording = true;
    ASSESSMENT_STATE.recordingStartTime = Date.now();
    ASSESSMENT_STATE.skeletonFrames = [];
    
    // Start video recording
    if (VideoRecorder.mediaRecorder) {
        VideoRecorder.startRecording();
    }
    
    // Update UI
    document.getElementById('recordingIndicator').style.display = 'flex';
    document.getElementById('recordBtn').style.display = 'none';
    document.getElementById('stopBtn').style.display = 'flex';
    
    showNotification('Recording started (video + skeleton)', 'success');
}

function stopRecordingWithVideo() {
    // Stop skeleton recording
    ASSESSMENT_STATE.isRecording = false;
    
    // Stop video recording
    const videoStats = VideoRecorder.stopRecording();
    
    // Update UI
    document.getElementById('recordingIndicator').style.display = 'none';
    document.getElementById('stopBtn').style.display = 'none';
    document.getElementById('analyzeBtn').style.display = 'flex';
    
    const message = videoStats 
        ? `Recording stopped. ${ASSESSMENT_STATE.skeletonFrames.length} frames, ${videoStats.duration}s video`
        : `Recording stopped. ${ASSESSMENT_STATE.skeletonFrames.length} frames captured`;
    
    showNotification(message, 'success');
}

async function uploadRecordedVideo() {
    if (!ASSESSMENT_STATE.patientId) {
        showNotification('No patient selected', 'error');
        return;
    }
    
    const stats = VideoRecorder.getStats();
    if (stats.size === 0) {
        showNotification('No video to upload', 'error');
        return;
    }
    
    await VideoRecorder.uploadVideo(
        ASSESSMENT_STATE.patientId,
        ASSESSMENT_STATE.assessmentId,
        {
            title: `Assessment - ${new Date().toLocaleString()}`,
            description: `Movement assessment with ${ASSESSMENT_STATE.skeletonFrames.length} skeleton frames`,
            videoType: 'assessment'
        }
    );
}

// Export for global access
window.VideoRecorder = VideoRecorder;
