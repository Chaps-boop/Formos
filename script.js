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
    this.showWelcomeScreen();
  },

  loadData: async function() {
    try {
      const response = await fetch('data.json');
      this.data = await response.json();
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
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
  this.currentOnboardingStep = 0;
  this.userProfile = {};
  this.userResponses = {};
  this.userScores = {};
  this.currentStep = 0;
  this.renderOnboarding();
  showScreen('onboarding-screen');
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
  if (this.currentStep >= this.data.steps.length) {
    this.showResults();
    return;
  }

  this.renderStep();
  this.renderSidebar();
  this.updateDailyChallenge();
  showScreen('journey-screen');
};

app.renderStep = function() {
  const step = this.data.steps[this.currentStep];
  const module = this.data.modules.find(m => m.id === step.module);

  document.getElementById('step-number').textContent = `Étape ${this.currentStep + 1}`;
  document.getElementById('step-module').textContent = module.name;

  let content = `<h2>${step.title}</h2>`;

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

  // Pré-remplir si réponse existante
  if (this.userResponses[this.currentStep]) {
    const response = this.userResponses[this.currentStep];
    if (step.type === 'reflection' || step.type === 'ranking') {
      document.getElementById('step-answer').value = response.text || '';
    }
  }

  document.getElementById('step-content').innerHTML = content;
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

  // Modules
  const modulesNav = document.getElementById('modules-nav');
  let modulesHtml = '';
  this.data.modules.forEach(module => {
    const isActive = this.data.steps[this.currentStep]?.module === module.id ? 'active' : '';
    modulesHtml += `<div class="module-item ${isActive}">${module.icon} ${module.name}</div>`;
  });
  modulesNav.innerHTML = modulesHtml;
};

app.updateDailyChallenge = function() {
  const today = new Date().getDate();
  const challengeIdx = today % this.data.challenges.length;
  document.getElementById('challenge-text').textContent = this.data.challenges[challengeIdx];
};

app.nextStep = function() {
  const step = this.data.steps[this.currentStep];

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

  return profile;
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
  return this.userScores.personality || 'Équilibré';
};

app.extractLearningStyle = function() {
  return this.userScores.learning_style || 'Polyvalent';
};

app.extractMotivation = function() {
  return this.userProfile.motivation || 'Transformation professionnelle';
};

app.renderResults = function() {
  const profile = this.generateResults();

  // Onglet profil
  let profileHtml = '';
  profileHtml += `<div class="profile-item">
    <h4>Votre nom</h4>
    <div class="profile-item-value">${profile.name}</div>
  </div>`;

  profileHtml += `<div class="profile-item">
    <h4>Situation actuelle</h4>
    <div class="profile-item-value">${profile.situation}</div>
  </div>`;

  profileHtml += `<div class="profile-item">
    <h4>Style d'apprentissage</h4>
    <div class="profile-item-value">${profile.learningStyle}</div>
  </div>`;

  profileHtml += `<div class="profile-item">
    <h4>Personnalité</h4>
    <div class="profile-item-value">${profile.personality || 'Unique'}</div>
  </div>`;

  profileHtml += `<div class="profile-item">
    <h4>Points forts clés</h4>
    <div class="profile-item-value">${profile.topStrengths.length} identifiés</div>
  </div>`;

  profileHtml += `<div class="profile-item">
    <h4>Valeurs principales</h4>
    <div class="profile-item-value">${profile.topValues.length} clarifiées</div>
  </div>`;

  document.getElementById('profile-grid').innerHTML = profileHtml;

  // Onglet recommandations
  let recsHtml = '';
  this.data.recommendations.forEach((rec, idx) => {
    const compatibility = 85 - (idx * 5);
    recsHtml += `
      <div class="recommendation-card">
        <div class="recommendation-rank">${idx + 1}</div>
        <h3>${rec.title}</h3>
        <div class="compatibility-score">Compatibilité: ${compatibility}%</div>
        <div class="score-bar">
          <div class="score-fill" style="width: ${compatibility}%"></div>
        </div>
        <p>${rec.description}</p>
        <p><strong>Salaire moyen:</strong> ${rec.avg_salary}</p>
      </div>
    `;
  });
  document.getElementById('recommendations-list').innerHTML = recsHtml;

  // Onglet plan d'action
  let actionHtml = '';
  this.data.recommendations[0]?.action_items.forEach((item, idx) => {
    const icons = ['🎯', '📚', '🤝', '🚀'];
    actionHtml += `
      <div class="action-step">
        <div class="action-step-icon">${icons[idx % icons.length]}</div>
        <div class="action-step-content">
          <h4>Étape ${idx + 1}</h4>
          <p>${item}</p>
        </div>
      </div>
    `;
  });
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
