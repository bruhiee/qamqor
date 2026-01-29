// main.js — точка входа для модульной версии
import { initUpload } from './upload.js';
import { initMapbox } from './map.js';
import { initUI } from './ui.js';
import * as chatModule from './chat.js';
import { initPulseCanvas } from './pulse.js';

const MAPBOX_TOKEN = null;

function init() {
    initUI(MAPBOX_TOKEN);
    initUpload();
    window.chatModule = chatModule;
    if (chatModule && typeof chatModule.initChat === 'function') chatModule.initChat();
    try { initPulseCanvas(); } catch (e) { console.warn('pulse init failed', e); }
}

init();
