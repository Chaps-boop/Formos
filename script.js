// ===== STATE MANAGEMENT =====
const app = {
  data: null,
  currentStep: 0,
  currentOnboardingStep: 0,
  userProfile: {},
  userResponses: {},
  userScores: {},
  savedState: null,

  init: async function() {
    await this.loadData();
    this.checkSavedState();
    this.setupEventListeners();
    showWelcomeScreen();
  },

  loadData: async function() {
    try {
      const response = await fetch('data.json');
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      this.data = await response.json();
      console.log('✓ Données chargées avec succès');
    } catch (error) {
      console.error('❌ Erreur lors du chargement des données:', error);
      alert('Erreur: Impossible de charger les données. Vérifiez votre connexion.');
    }
  },

  checkSavedState: function() {
    const saved = localStorage.getItem('centPasState');
    if (saved) {
      this.savedState = JSON.parse(saved);
      document.getElementById('continue-btn').style.display = 'inline-block';
      document.getElementById('start-btn').style.display = 'none';
    }
  },

  saveState: function() {
    const state = {
      currentStep: this.currentStep,
      userProfile: this.userProfile,
      userResponses: this.userResponses,
      userScores: this.userScores,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem('centPasState', JSON.stringify(state));
  },

  setupEventListeners: function() {
    document.getElementById('start-btn').addEventListener('click', () => this.startJourney());
    document.getElementById('continue-btn').addEventListener('click', () => this.continueJourney());
    document.getElementById('test-btn').addEventListener('click', () => this.autoFillAnswers());

    document.getElementById('onboarding-next').addEventListener('click', () => this.nextOnboarding());
    document.getElementById('onboarding-prev').addEventListener('click', () => this.prevOnboarding());

    document.getElementById('next-step').addEventListener('click', () => this.nextStep());
    document.getElementById('prev-step').addEventListener('click', () => this.prevStep());

    document.getElementById('save-btn').addEventListener('click', () => this.saveAndNotify());

    // Tabs des résultats
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
    });

    document.getElementById('export-pdf').addEventListener('click', () => this.exportPDF());
    document.getElementById('restart-btn').addEventListener('click', () => this.restart());
  }
};

// ===== ÉCRANS PRINCIPAUX =====
function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(screenId).classList.add('active');
}

function showWelcomeScreen() {
  showScreen('welcome-screen');
}

// ===== DÉMARRAGE DU PARCOURS =====
app.startJourney = function() {
  try {
    console.log('🎯 startJourney called');
    console.log('Data exists?', !!this.data);
    console.log('Data steps?', this.data ? this.data.steps.length : 'NO DATA');

    this.currentOnboardingStep = 0;
    this.userProfile = {};
    this.userResponses = {};
    this.userScores = {};
    this.currentStep = 0;

    console.log('📝 About to call renderOnboarding');
    this.renderOnboarding();
    console.log('📝 renderOnboarding done, about to call showScreen');
    showScreen('onboarding-screen');
    console.log('✅ showScreen done, onboarding screen should be visible');
  } catch (error) {
    console.error('❌ ERROR in startJourney:', error);
    console.error('Stack:', error.stack);
  }
};

app.autoFillAnswers = function() {
  // Profil de test
  this.currentOnboardingStep = 0;
  this.userProfile = {
    name: 'Test Utilisateur',
    situation: 'Salarié en reconversion',
    years_experience: '5-10 ans',
    sector: 'Technologie',
    motivation: 'Développement personnel',
    constraints: 'Aucune'
  };

  this.userResponses = {};
  this.userScores = {};
  this.currentStep = 0;

  // Remplir toutes les étapes automatiquement
  for (let i = 0; i < this.data.steps.length; i++) {
    const step = this.data.steps[i];

    if (step.type === 'reflection' || step.type === 'ranking') {
      this.userResponses[i] = {
        type: step.type,
        text: `Réponse test pour l'étape ${i + 1}: ${step.title}`
      };
    } else if (step.type === 'quiz') {
      const randomIdx = Math.floor(Math.random() * step.options.length);
      const option = step.options[randomIdx];
      this.userResponses[i] = {
        type: 'quiz',
        selectedIdx: randomIdx,
        selectedOption: option.text,
        scores: option.score || {}
      };
      Object.keys(option.score || {}).forEach(key => {
        this.userScores[key] = (this.userScores[key] || 0) + option.score[key];
      });
    } else if (step.type === 'slider') {
      const randomIdx = Math.floor(Math.random() * step.scale.length);
      this.userResponses[i] = {
        type: 'slider',
        selectedIdx: randomIdx,
        selectedLabel: step.scale[randomIdx]
      };
    } else if (step.type === 'checklist') {
      const selected = step.options.slice(0, Math.floor(step.options.length / 2));
      this.userResponses[i] = {
        type: 'checklist',
        selected: selected
      };
    }
  }

  // Afficher le parcours depuis la première étape
  this.currentStep = 0;
  this.renderJourneyScreen();
};

app.continueJourney = function() {
  const saved = this.savedState;
  this.currentStep = saved.currentStep;
  this.userProfile = saved.userProfile;
  this.userResponses = saved.userResponses;
  this.userScores = saved.userScores;

  this.renderJourneyScreen();
  showScreen('journey-screen');
};

// ===== ONBOARDING =====
app.renderOnboarding = function() {
  const question = this.data.onboarding[this.currentOnboardingStep];
  const form = document.getElementById('onboarding-form');
  const progress = (this.currentOnboardingStep / this.data.onboarding.length) * 100;

  document.getElementById('onboarding-progress').style.width = progress + '%';

  let html = `<div class="form-group">`;
  html += `<label>${question.question}</label>`;

  if (question.type === 'text') {
    html += `<input type="text" id="answer" placeholder="${question.placeholder}" class="form-input">`;
  } else if (question.type === 'textarea') {
    html += `<textarea id="answer" placeholder="${question.placeholder}" class="form-input" rows="4"></textarea>`;
  } else if (question.type === 'select') {
    html += `<select id="answer" class="form-input">`;
    html += `<option value="">Sélectionner...</option>`;
    question.options.forEach(opt => {
      html += `<option value="${opt}">${opt}</option>`;
    });
    html += `</select>`;
  } else if (question.type === 'buttons') {
    html += `<div class="options-group">`;
    question.options.forEach(opt => {
      html += `<button type="button" class="option-btn" onclick="selectOption('${opt}')">${opt}</button>`;
    });
    html += `</div>`;
  }

  html += `</div>`;
  form.innerHTML = html;

  // Pré-remplir si réponse existante
  if (this.userProfile[question.id]) {
    const input = form.querySelector('input, textarea, select');
    if (input) input.value = this.userProfile[question.id];
  }
};

window.selectOption = function(value) {
  app.userProfile[app.data.onboarding[app.currentOnboardingStep].id] = value;
  document.querySelectorAll('.option-btn').forEach(btn => btn.classList.remove('selected'));
  event.target.classList.add('selected');
};

app.nextOnboarding = function() {
  console.log('📋 nextOnboarding called, step:', this.currentOnboardingStep);
  const question = this.data.onboarding[this.currentOnboardingStep];
  const form = document.getElementById('onboarding-form');
  const input = form.querySelector('input, textarea, select');
  const selectedBtn = form.querySelector('.option-btn.selected');

  const value = selectedBtn ? selectedBtn.textContent : (input ? input.value : '');

  if (!value) {
    alert('Veuillez répondre à cette question');
    return;
  }

  this.userProfile[question.id] = value;

  if (this.currentOnboardingStep < this.data.onboarding.length - 1) {
    this.currentOnboardingStep++;
    this.renderOnboarding();
  } else {
    console.log('✅ Onboarding complété, démarrage du parcours');
    this.currentStep = 0;
    this.renderJourneyScreen();
    showScreen('journey-screen');
  }
};

app.prevOnboarding = function() {
  if (this.currentOnboardingStep > 0) {
    this.currentOnboardingStep--;
    this.renderOnboarding();
  }
};

// ===== ÉCRAN PRINCIPAL DU PARCOURS =====
app.renderJourneyScreen = function() {
  console.log('🚀 renderJourneyScreen called, currentStep:', this.currentStep, 'total:', this.data.steps.length);

  if (this.currentStep >= this.data.steps.length) {
    console.log('✅ Parcours terminé');
    this.showResults();
    return;
  }

  // Remplir le contenu EN PREMIER (avant d'afficher)
  this.renderStep();
  this.renderSidebar();
  this.updateDailyChallenge();

  // Puis afficher l'écran
  showScreen('journey-screen');
};

app.getModuleIllustration = function(moduleId) {
  const illustrations = {
    'profiling': `<svg class="module-illustration" viewBox="0 0 150 120" xmlns="http://www.w3.org/2000/svg">
      <circle cx="75" cy="35" r="20" fill="#2c5282" opacity="0.8"/>
      <ellipse cx="75" cy="70" rx="18" ry="25" fill="#2c5282" opacity="0.7"/>
      <path d="M 57 60 L 50 80" stroke="#2c5282" stroke-width="3" stroke-linecap="round" opacity="0.7"/>
      <path d="M 93 60 L 100 80" stroke="#2c5282" stroke-width="3" stroke-linecap="round" opacity="0.7"/>
      <circle cx="30" cy="20" r="6" fill="#c9934f" opacity="0.6"/>
      <circle cx="120" cy="40" r="5" fill="#c9934f" opacity="0.5"/>
      <circle cx="25" cy="100" r="4" fill="#1e5631" opacity="0.5"/>
    </svg>`,
    'competencies': `<svg class="module-illustration" viewBox="0 0 150 120" xmlns="http://www.w3.org/2000/svg">
      <circle cx="75" cy="40" r="18" fill="#1e5631" opacity="0.8"/>
      <circle cx="50" cy="70" r="14" fill="#2c5282" opacity="0.7"/>
      <circle cx="100" cy="70" r="14" fill="#2c5282" opacity="0.7"/>
      <circle cx="75" cy="95" r="12" fill="#c9934f" opacity="0.7"/>
      <line x1="75" y1="58" x2="50" y2="70" stroke="#4a7ba7" stroke-width="2" opacity="0.5"/>
      <line x1="75" y1="58" x2="100" y2="70" stroke="#4a7ba7" stroke-width="2" opacity="0.5"/>
      <line x1="75" y1="58" x2="75" y2="95" stroke="#4a7ba7" stroke-width="2" opacity="0.5"/>
    </svg>`,
    'values': `<svg class="module-illustration" viewBox="0 0 150 120" xmlns="http://www.w3.org/2000/svg">
      <path d="M 75 20 L 85 40 L 105 40 L 90 50 L 95 70 L 75 60 L 55 70 L 60 50 L 45 40 L 65 40 Z" fill="#c9934f" opacity="0.8"/>
      <path d="M 50 85 L 56 98 L 68 98 L 58 104 L 62 115 L 50 110 L 38 115 L 42 104 L 32 98 L 44 98 Z" fill="#2c5282" opacity="0.6"/>
      <path d="M 100 85 L 106 98 L 118 98 L 108 104 L 112 115 L 100 110 L 88 115 L 92 104 L 82 98 L 94 98 Z" fill="#1e5631" opacity="0.6"/>
    </svg>`,
    'experiences': `<svg class="module-illustration" viewBox="0 0 150 120" xmlns="http://www.w3.org/2000/svg">
      <rect x="20" y="25" width="40" height="30" fill="#2c5282" opacity="0.7" rx="4"/>
      <rect x="70" y="35" width="40" height="30" fill="#4a7ba7" opacity="0.7" rx="4"/>
      <circle cx="40" cy="45" r="6" fill="#c9934f" opacity="0.8"/>
      <circle cx="90" cy="55" r="6" fill="#c9934f" opacity="0.8"/>
      <path d="M 60 40 Q 75 30 80 35" stroke="#1e5631" stroke-width="2.5" fill="none" stroke-linecap="round" opacity="0.6"/>
      <rect x="45" y="75" width="60" height="3" fill="#1e5631" opacity="0.5"/>
      <rect x="45" y="85" width="50" height="3" fill="#1e5631" opacity="0.5"/>
    </svg>`,
    'personality': `<svg class="module-illustration" viewBox="0 0 150 120" xmlns="http://www.w3.org/2000/svg">
      <circle cx="75" cy="30" r="16" fill="#2c5282" opacity="0.8"/>
      <path d="M 60 45 Q 75 70 90 45" stroke="#c9934f" stroke-width="3" fill="none" stroke-linecap="round" opacity="0.7"/>
      <circle cx="65" cy="40" r="3" fill="#1e5631" opacity="0.7"/>
      <circle cx="85" cy="40" r="3" fill="#1e5631" opacity="0.7"/>
      <path d="M 55 80 L 95 80" stroke="#4a7ba7" stroke-width="2.5" opacity="0.6"/>
      <circle cx="75" cy="95" r="8" fill="#1e5631" opacity="0.5"/>
    </svg>`,
    'exploration': `<svg class="module-illustration" viewBox="0 0 150 120" xmlns="http://www.w3.org/2000/svg">
      <circle cx="75" cy="50" r="15" fill="none" stroke="#2c5282" stroke-width="2" opacity="0.8"/>
      <line x1="75" y1="50" x2="90" y2="50" stroke="#2c5282" stroke-width="2" opacity="0.8"/>
      <circle cx="90" cy="50" r="3" fill="#c9934f" opacity="0.9"/>
      <path d="M 75 50 L 65 35 L 85 35" stroke="#1e5631" stroke-width="2" fill="none" opacity="0.7"/>
      <path d="M 75 50 L 60 70 L 65 75" stroke="#4a7ba7" stroke-width="2" fill="none" opacity="0.7"/>
      <path d="M 75 50 L 90 70 L 85 75" stroke="#4a7ba7" stroke-width="2" fill="none" opacity="0.7"/>
    </svg>`
  };
  return illustrations[moduleId] || '';
};

app.renderStep = function() {
  console.log('renderStep called, currentStep:', this.currentStep);

  const step = this.data.steps[this.currentStep];
  if (!step) {
    console.error('❌ Step not found at index', this.currentStep);
    return;
  }

  const module = this.data.modules.find(m => m.id === step.module);
  if (!module) {
    console.error('❌ Module not found for step', step);
    return;
  }

  const stepNumberEl = document.getElementById('step-number');
  const stepModuleEl = document.getElementById('step-module');

  if (!stepNumberEl || !stepModuleEl) {
    console.error('❌ step-number or step-module element not found');
    return;
  }

  stepNumberEl.textContent = `Étape ${this.currentStep + 1}`;
  stepModuleEl.textContent = module.name;

  let content = `<div class="step-header-section">
    ${this.getModuleIllustration(module.id)}
    <h2>${step.title}</h2>
  </div>`;

  if (step.type === 'reflection') {
    content += `<div class="question"><p>${step.content}</p></div>`;
    content += `<textarea id="step-answer" class="step-input" placeholder="${step.instruction}" rows="6"></textarea>`;
  } else if (step.type === 'quiz') {
    content += `<div class="question"><p>${step.content}</p></div>`;
    content += `<div class="options-group">`;
    step.options.forEach((opt, idx) => {
      content += `<button type="button" class="option-btn quiz-option" data-idx="${idx}" onclick="selectQuizOption(${idx})">${opt.text}</button>`;
    });
    content += `</div>`;
  } else if (step.type === 'slider') {
    content += `<div class="question"><p>${step.content}</p></div>`;
    content += `<div style="margin: 30px 0;">`;
    step.scale.forEach((label, idx) => {
      content += `<button type="button" class="option-btn slider-option" data-idx="${idx}" onclick="selectSliderOption(${idx})">${label}</button>`;
    });
    content += `</div>`;
  } else if (step.type === 'checklist') {
    content += `<div class="question"><p>${step.content}</p></div>`;
    content += `<div class="options-group">`;
    step.options.forEach((opt, idx) => {
      content += `<label style="display: flex; align-items: center; padding: 12px; margin-bottom: 8px; background: var(--bg-light); border-radius: var(--radius); cursor: pointer;">`;
      content += `<input type="checkbox" class="checklist-item" data-idx="${idx}" value="${opt}" style="margin-right: 10px;"> ${opt}`;
      content += `</label>`;
    });
    content += `</div>`;
  } else if (step.type === 'ranking') {
    content += `<div class="question"><p>${step.content}</p></div>`;
    content += `<textarea id="step-answer" class="step-input" placeholder="Classez les éléments par ordre d'importance" rows="6"></textarea>`;
  }

  // Insérer le contenu dans le DOM
  const stepContentEl = document.getElementById('step-content');
  if (!stepContentEl) {
    console.error('❌ step-content element not found!');
    return;
  }

  console.log('✅ Inserting content for step:', step.title);
  stepContentEl.innerHTML = content;
  console.log('✅ Content inserted, innerHTML length:', stepContentEl.innerHTML.length);

  // Pré-remplir les réponses existantes
  if (this.userResponses[this.currentStep]) {
    const response = this.userResponses[this.currentStep];

    if ((step.type === 'reflection' || step.type === 'ranking') && response.text) {
      const textarea = document.getElementById('step-answer');
      if (textarea) {
        textarea.value = response.text;
      }
    }

    if (step.type === 'quiz' && response.selectedIdx !== undefined) {
      const btns = document.querySelectorAll('.quiz-option');
      if (btns[response.selectedIdx]) {
        btns[response.selectedIdx].classList.add('selected');
      }
    }

    if (step.type === 'slider' && response.selectedIdx !== undefined) {
      const btns = document.querySelectorAll('.slider-option');
      if (btns[response.selectedIdx]) {
        btns[response.selectedIdx].classList.add('selected');
      }
    }

    if (step.type === 'checklist' && response.selected) {
      response.selected.forEach(val => {
        const checkbox = document.querySelector(`input.checklist-item[value="${val}"]`);
        if (checkbox) checkbox.checked = true;
      });
    }
  }
};

window.selectQuizOption = function(idx) {
  document.querySelectorAll('.quiz-option').forEach(btn => btn.classList.remove('selected'));
  event.target.classList.add('selected');

  const step = app.data.steps[app.currentStep];
  const selectedOption = step.options[idx];

  app.userResponses[app.currentStep] = {
    type: 'quiz',
    selectedIdx: idx,
    selectedOption: selectedOption.text,
    scores: selectedOption.score || {}
  };

  // Appliquer les scores
  Object.keys(selectedOption.score || {}).forEach(key => {
    app.userScores[key] = (app.userScores[key] || 0) + selectedOption.score[key];
  });
};

window.selectSliderOption = function(idx) {
  document.querySelectorAll('.slider-option').forEach(btn => btn.classList.remove('selected'));
  event.target.classList.add('selected');

  const step = app.data.steps[app.currentStep];
  app.userResponses[app.currentStep] = {
    type: 'slider',
    selectedIdx: idx,
    selectedLabel: step.scale[idx]
  };
};

app.renderSidebar = function() {
  const profile = document.getElementById('profile-summary');
  let html = `<div style="font-size: 14px;">`;
  html += `<p><strong>${this.userProfile.name || 'Utilisateur'}</strong></p>`;
  if (this.userProfile.situation) {
    html += `<p>Situation: ${this.userProfile.situation}</p>`;
  }
  if (this.userProfile.years_experience) {
    html += `<p>Expérience: ${this.userProfile.years_experience}</p>`;
  }
  html += `</div>`;
  profile.innerHTML = html;

  const progress = Math.round((this.currentStep / this.data.steps.length) * 100);
  document.getElementById('big-progress').textContent = progress + '%';
  document.getElementById('current-step').textContent = this.currentStep;
  document.getElementById('total-steps').textContent = this.data.steps.length;

  // Modules - Determiner les modules complétés et actifs
  const modulesNav = document.getElementById('modules-nav');
  let modulesHtml = '';

  this.data.modules.forEach(module => {
    const currentModuleId = this.data.steps[this.currentStep]?.module;
    const isActive = currentModuleId === module.id;

    // Vérifier si le module est complété (toutes ses étapes sont passées)
    const moduleSteps = module.steps;
    const maxStepInModule = Math.max(...moduleSteps);
    const isCompleted = this.currentStep > maxStepInModule;

    let status = '';
    if (isCompleted) {
      status = 'completed';
    } else if (isActive) {
      status = 'active';
    }

    const checkmark = isCompleted ? '✓' : '';
    modulesHtml += `<div class="module-item module-${status}" data-module="${module.id}">
      <span class="module-icon">${module.icon}</span>
      <span class="module-name">${module.name}</span>
      ${checkmark ? `<span class="module-checkmark">${checkmark}</span>` : ''}
    </div>`;
  });
  modulesNav.innerHTML = modulesHtml;
};

app.updateDailyChallenge = function() {
  const challengeElement = document.getElementById('challenge-text');
  if (!challengeElement) return;
  const today = new Date().getDate();
  const challengeIdx = today % this.data.challenges.length;
  challengeElement.textContent = this.data.challenges[challengeIdx];
};

app.nextStep = function() {
  const step = this.data.steps[this.currentStep];

  // Si on est au-delà de la dernière étape, afficher les résultats
  if (!step) {
    this.showResults();
    return;
  }

  // Capturer la réponse
  if (step.type === 'reflection' || step.type === 'ranking') {
    const textarea = document.getElementById('step-answer');
    if (textarea && textarea.value) {
      this.userResponses[this.currentStep] = {
        type: step.type,
        text: textarea.value
      };
    }
  } else if (step.type === 'checklist') {
    const checked = Array.from(document.querySelectorAll('.checklist-item:checked'))
      .map(el => el.value);
    if (checked.length > 0) {
      this.userResponses[this.currentStep] = {
        type: 'checklist',
        selected: checked
      };
    }
  }

  this.currentStep++;
  this.renderJourneyScreen();
};

app.prevStep = function() {
  if (this.currentStep > 0) {
    this.currentStep--;
    this.renderJourneyScreen();
  }
};

app.saveAndNotify = function() {
  this.saveState();
  document.getElementById('save-message').textContent = `Votre parcours a été sauvegardé à ${new Date().toLocaleTimeString('fr-FR')}. Vous avez complété ${this.currentStep} étapes sur 100.`;
  document.getElementById('save-modal').classList.add('active');
};

window.closeSaveModal = function() {
  document.getElementById('save-modal').classList.remove('active');
};

// ===== RÉSULTATS FINAUX =====
app.showResults = function() {
  this.generateResults();
  this.renderResults();
  showScreen('results-screen');
};

app.generateResults = function() {
  // Calculer le profil synthétisé
  const profile = {
    name: this.userProfile.name,
    situation: this.userProfile.situation,
    topStrengths: this.extractTopStrengths(),
    topValues: this.extractTopValues(),
    personality: this.extractPersonality(),
    learningStyle: this.extractLearningStyle(),
    motivation: this.extractMotivation()
  };

  // Sélectionner les 5 meilleurs métiers
  this.selectedRecommendations = this.selectBestRecommendations(profile);

  return profile;
};

app.selectBestRecommendations = function(profile) {
  const scored = this.data.recommendations.map(job => {
    let score = job.compatibility || 70;

    // Bonus si les valeurs correspondent
    if (job.values_match && profile.topValues.length > 0) {
      const valueMatches = profile.topValues.filter(v =>
        job.values_match.some(jv => v.toLowerCase().includes(jv.toLowerCase()))
      ).length;
      score += (valueMatches * 5);
    }

    // Bonus si les compétences correspondent
    if (job.user_skills && profile.topStrengths.length > 0) {
      const skillMatches = profile.topStrengths.filter(s =>
        job.user_skills.some(js => s.toLowerCase().includes(js.toLowerCase()))
      ).length;
      score += (skillMatches * 3);
    }

    // Bonus si le secteur correspond aux réponses
    const responses = Object.values(this.userResponses).map(r => r.text || '').join(' ').toLowerCase();
    if (job.sector && responses.includes(job.sector.toLowerCase())) {
      score += 10;
    }

    // Ajouter un peu de variété (randomiser un peu)
    score += Math.random() * 5;

    return { ...job, score };
  });

  // Retourner les 5 meilleurs
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map((job, idx) => ({ ...job, rank_idx: idx }));
};

app.extractTopStrengths = function() {
  // Analyser les réponses sur les compétences
  const strengths = [];
  Object.keys(this.userResponses).forEach(stepIdx => {
    const step = this.data.steps[stepIdx];
    if (step.module === 'competencies') {
      const response = this.userResponses[stepIdx];
      if (response.text) {
        strengths.push(response.text);
      }
    }
  });
  return strengths.slice(0, 5);
};

app.extractTopValues = function() {
  const values = [];
  Object.keys(this.userResponses).forEach(stepIdx => {
    const step = this.data.steps[stepIdx];
    if (step.module === 'values') {
      const response = this.userResponses[stepIdx];
      if (response.text) {
        values.push(response.text);
      }
    }
  });
  return values.slice(0, 5);
};

app.extractPersonality = function() {
  // Analyser les réponses pour déterminer la personnalité
  const personalities = {
    leadership: 0,
    creativity: 0,
    analytical: 0,
    empathy: 0,
    risk: 0
  };

  // Compter les réponses par type de module et contenu
  Object.keys(this.userResponses).forEach(stepIdx => {
    const step = this.data.steps[stepIdx];
    const response = this.userResponses[stepIdx];

    if (response.text) {
      const text = response.text.toLowerCase();
      // Analyser les mots-clés pour déduire la personnalité
      if (text.includes('équipe') || text.includes('leader') || text.includes('diriger')) personalities.leadership++;
      if (text.includes('créativ') || text.includes('nouveau') || text.includes('innov')) personalities.creativity++;
      if (text.includes('analys') || text.includes('logique') || text.includes('données')) personalities.analytical++;
      if (text.includes('humain') || text.includes('écoute') || text.includes('compren')) personalities.empathy++;
      if (text.includes('risque') || text.includes('aventure') || text.includes('défi')) personalities.risk++;
    }
  });

  // Déterminer le type de personnalité dominant
  const sorted = Object.entries(personalities).sort((a, b) => b[1] - a[1]);
  const topTraits = sorted.filter(([key, val]) => val > 0).slice(0, 2);

  if (topTraits.length === 0) return 'Équilibré et polyvalent';

  const personalityMap = {
    leadership: 'Leader inspirant et visionnaire',
    creativity: 'Créatif et innovant',
    analytical: 'Analytique et méthodique',
    empathy: 'Empathique et collaboratif',
    risk: 'Entrepreneurial et aventureux'
  };

  if (topTraits.length === 1) {
    return personalityMap[topTraits[0][0]] || 'Équilibré';
  } else {
    return personalityMap[topTraits[0][0]] + ' + ' + personalityMap[topTraits[1][0]];
  }
};

app.extractLearningStyle = function() {
  // Analyser les réponses pour déterminer le style d'apprentissage
  const learningStyles = {
    visual: 0,
    auditory: 0,
    kinesthetic: 0,
    reading: 0
  };

  Object.keys(this.userResponses).forEach(stepIdx => {
    const response = this.userResponses[stepIdx];

    if (response.text) {
      const text = response.text.toLowerCase();
      if (text.includes('voir') || text.includes('image') || text.includes('visual')) learningStyles.visual++;
      if (text.includes('entendre') || text.includes('écoute') || text.includes('parler')) learningStyles.auditory++;
      if (text.includes('faire') || text.includes('expérien') || text.includes('pratiqu')) learningStyles.kinesthetic++;
      if (text.includes('lire') || text.includes('écrit') || text.includes('livre')) learningStyles.reading++;
    }
  });

  const sorted = Object.entries(learningStyles).sort((a, b) => b[1] - a[1]);

  const styleMap = {
    visual: 'Visuel - Préfère les schémas et diagrammes',
    auditory: 'Auditif - Apprend en écoutant et discutant',
    kinesthetic: 'Kinesthésique - Apprend en faisant',
    reading: 'Lecture/Écriture - Préfère lire et écrire'
  };

  if (sorted[0][1] > 0) {
    return styleMap[sorted[0][0]];
  }

  return 'Polyvalent - Combine plusieurs styles';
};

app.extractMotivation = function() {
  return this.userProfile.motivation || 'Transformation professionnelle';
};

app.triggerConfetti = function() {
  const canvas = document.createElement('canvas');
  canvas.id = 'confetti-canvas';
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '9999';
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const confetti = [];
  const colors = ['#1a365d', '#4c7ba7', '#2d8659', '#d4a574', '#b8956f'];

  for (let i = 0; i < 100; i++) {
    confetti.push({
      x: Math.random() * canvas.width,
      y: -10,
      vx: Math.random() * 4 - 2,
      vy: Math.random() * 5 + 5,
      life: 1,
      color: colors[Math.floor(Math.random() * colors.length)]
    });
  }

  const animate = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let active = false;

    confetti.forEach(p => {
      if (p.life > 0) {
        active = true;
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.1;
        p.life -= 0.01;

        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, 5, 5);
      }
    });

    if (active) requestAnimationFrame(animate);
    else canvas.remove();
  };
  animate();
};

app.renderResults = function() {
  const profile = this.generateResults();
  this.triggerConfetti();

  // Onglet profil
  let profileHtml = `<div class="profile-summary">
    <div class="profile-header">
      <h2>🎯 Votre Profil Détaillé</h2>
      <p class="profile-intro">Découvrez votre bilan complet de compétences et aptitudes</p>
    </div>
  </div>`;

  profileHtml += `<div class="profile-grid">
    <div class="profile-item">
      <div class="profile-icon">👤</div>
      <h4>Votre nom</h4>
      <div class="profile-item-value">${profile.name}</div>
    </div>

    <div class="profile-item">
      <div class="profile-icon">💼</div>
      <h4>Situation actuelle</h4>
      <div class="profile-item-value">${profile.situation}</div>
    </div>

    <div class="profile-item">
      <div class="profile-icon">📖</div>
      <h4>Style d'apprentissage</h4>
      <div class="profile-item-value">${profile.learningStyle}</div>
    </div>

    <div class="profile-item">
      <div class="profile-icon">✨</div>
      <h4>Personnalité</h4>
      <div class="profile-item-value">${profile.personality || 'Unique'}</div>
    </div>

    <div class="profile-item">
      <div class="profile-icon">💪</div>
      <h4>Points forts clés</h4>
      <div class="profile-item-value badge-highlight">${profile.topStrengths.length}</div>
      <p class="profile-item-desc">identifiés</p>
    </div>

    <div class="profile-item">
      <div class="profile-icon">🎨</div>
      <h4>Valeurs principales</h4>
      <div class="profile-item-value badge-highlight">${profile.topValues.length}</div>
      <p class="profile-item-desc">clarifiées</p>
    </div>
  </div>`;

  // Modules complétés avec badges
  const completedModules = Object.keys(this.userScores || {}).length;
  profileHtml += `<div class="modules-completed">
    <h3>📈 Parcours Complété</h3>
    <div class="modules-badges">`;

  const moduleNames = ['Profiling', 'Compétences', 'Valeurs', 'Expériences', 'Personnalité', 'Exploration'];
  moduleNames.forEach((name, idx) => {
    profileHtml += `<span class="badge-module">✓ ${name}</span>`;
  });

  profileHtml += `</div></div>`;

  document.getElementById('profile-grid').innerHTML = profileHtml;

  // Onglet recommandations enrichies
  let recsHtml = `<div class="recommendations-intro">
    <h2>⛰️ Votre Ascension Professionnelle</h2>
    <p>5 chemins adaptés à votre profil unique - Du premier pas au sommet</p>
  </div><div class="job-matching-cards">`;

  this.selectedRecommendations.forEach((rec, idx) => {
    const compatibility = Math.round(rec.score || (85 - (idx * 5)));
    const medals = ['🥇', '🥈', '🥉', '🏔️', '⛰️'];
    const userSkills = rec.user_skills || [];

    recsHtml += `
      <div class="job-card" style="animation-delay: ${idx * 0.1}s">
        <div class="job-card-header">
          <div class="job-card-title">
            <div class="job-card-icon">${rec.icon}</div>
            <div>
              <h2>${rec.title}</h2>
              <div style="font-size: 14px; margin-top: 4px; opacity: 0.95;">${rec.description}</div>
            </div>
          </div>
          <div class="job-card-meta">
            <div class="job-meta-item">
              <div class="job-meta-label">Compatibilité</div>
              <div class="job-meta-value">${compatibility}%</div>
            </div>
            <div class="job-meta-item">
              <div class="job-meta-label">Salaire annuel</div>
              <div class="job-meta-value">${rec.avg_salary}</div>
            </div>
            <div class="job-meta-item">
              <div class="job-meta-label">Potentiel</div>
              <div class="job-meta-value" style="font-size: 14px;">${rec.growth_potential}</div>
            </div>
            <div class="job-meta-item">
              <div class="job-meta-label">Rang</div>
              <div class="job-meta-value" style="font-size: 24px;">${medals[idx]}</div>
            </div>
          </div>
        </div>

        <div class="job-card-body">
          <div class="job-why-match">
            <div class="job-why-match-label">✨ Pourquoi c'est un bon match</div>
            <div class="job-why-match-text">${rec.why_match}</div>
          </div>

          <div class="job-skills-section">
            <div class="job-skills-title">💪 Compétences requises</div>
            <div class="skills-required">
              ${rec.required_skills.map((skill, skillIdx) => {
                const isMatched = userSkills.some(us => us.toLowerCase().includes(skill.name.split(' ')[0].toLowerCase()));
                return `
                  <div class="skill-item">
                    <div class="skill-name-level">
                      <div class="skill-name">${skill.name}</div>
                      <div class="skill-level">Niveau: ${skill.level}</div>
                    </div>
                    <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 4px;">
                      <div class="skill-match-indicator">
                        ${[1, 2, 3].map((level, i) => {
                          const matched = (i < (skill.level === 'Expert' ? 3 : skill.level === 'Avancé' ? 2 : 1)) ? ' matched' : '';
                          return `<div class="skill-match-dot${matched}"></div>`;
                        }).join('')}
                      </div>
                      <div class="skill-importance">${skill.importance}</div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>

          <div class="job-challenges">
            <div class="job-challenges-label">⚠️ Défis à relever</div>
            <div class="job-challenges-text">${rec.challenges}</div>
          </div>

          <div class="job-action-plan">
            <div class="job-action-label">📍 Prochaines étapes</div>
            <div class="job-action-list">
              ${rec.action_items.map(item => `<div class="job-action-item">${item}</div>`).join('')}
            </div>
          </div>
        </div>
      </div>
    `;
  });

  recsHtml += `</div>`;
  document.getElementById('recommendations-list').innerHTML = recsHtml;

  // Onglet plan d'action détaillé
  let actionHtml = `<div class="action-intro">
    <h2>📋 Votre Plan d'Action Personnalisé</h2>
    <p>Étapes concrètes pour ${this.selectedRecommendations[0]?.title || 'votre carrière'}</p>
  </div>`;

  actionHtml += `<div class="action-timeline">`;

  this.selectedRecommendations[0]?.action_items.forEach((item, idx) => {
    const icons = ['🎯', '📚', '🤝', '🚀'];
    const timeframes = ['Immédiat (1-2 semaines)', 'À court terme (1-3 mois)', 'À moyen terme (3-6 mois)', 'À long terme (6-12 mois)'];

    actionHtml += `
      <div class="action-step" style="animation-delay: ${idx * 0.1}s">
        <div class="action-step-number">${idx + 1}</div>
        <div class="action-step-content">
          <h4>${icons[idx % icons.length]} ${item}</h4>
          <p class="action-timeframe">${timeframes[idx % timeframes.length]}</p>
        </div>
        <div class="action-step-bullet"></div>
      </div>
    `;
  });

  actionHtml += `</div>`;

  document.getElementById('action-plan').innerHTML = actionHtml;
};

app.switchTab = function(tabName) {
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));

  event.target.classList.add('active');
  document.getElementById(tabName + '-tab').classList.add('active');
};

app.exportPDF = function() {
  const element = document.querySelector('.results-grid');
  const opt = {
    margin: 10,
    filename: 'cent-pas-bilan.pdf',
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' }
  };

  // Pour une vraie implémentation, utiliser html2pdf
  alert('Téléchargement PDF disponible avec intégration html2pdf');
  console.log('Données à exporter:', {
    profile: this.generateResults(),
    responses: this.userResponses,
    scores: this.userScores
  });
};

app.restart = function() {
  localStorage.removeItem('centPasState');
  location.reload();
};

// ===== INITIALISATION =====
document.addEventListener('DOMContentLoaded', () => {
  app.init();
});
