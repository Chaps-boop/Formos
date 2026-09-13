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
    // Données intégrées directement
    this.data = {"modules": [{"id": "profiling", "name": "Qui suis-je vraiment ?", "icon": "\ud83d\udd0d", "description": "D\u00e9couvrez votre vrai profil", "color": "#6366f1", "steps": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]}, {"id": "competencies", "name": "Mes comp\u00e9tences", "icon": "\ud83d\udcaa", "description": "R\u00e9v\u00e9lez vos talents cach\u00e9s", "color": "#ec4899", "steps": [16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35]}, {"id": "values", "name": "Mes valeurs", "icon": "\ud83d\udc8e", "description": "Ce qui vous anime vraiment", "color": "#f59e0b", "steps": [36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55]}, {"id": "experiences", "name": "Mes exp\u00e9riences", "icon": "\ud83c\udfaf", "description": "Les le\u00e7ons de mon parcours", "color": "#10b981", "steps": [56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75]}, {"id": "personality", "name": "Ma personnalit\u00e9", "icon": "\ud83e\udde0", "description": "Comment je fonctionne", "color": "#8b5cf6", "steps": [76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90]}, {"id": "exploration", "name": "Explorer l'avenir", "icon": "\ud83d\ude80", "description": "Vers quelle direction ?", "color": "#06b6d4", "steps": [91, 92, 93, 94, 95, 96, 97, 98, 99, 100]}], "onboarding": [{"id": "name", "question": "Quel est votre pr\u00e9nom ?", "type": "text", "placeholder": "Ex: Marie"}, {"id": "age_range", "question": "Quelle est votre tranche d'\u00e2ge ?", "type": "select", "options": ["18-25 ans", "26-35 ans", "36-45 ans", "46-55 ans", "56+ ans"]}, {"id": "situation", "question": "Quelle est votre situation actuelle ?", "type": "buttons", "options": ["Salari\u00e9\u00b7e", "Cadre", "Demandeur d'emploi", "Entrepreneur", "En \u00e9tudes"]}, {"id": "sector", "question": "Quel secteur d'activit\u00e9 ?", "type": "text", "placeholder": "Ex: Informatique, Vente, Sant\u00e9..."}, {"id": "years_experience", "question": "Combien d'ann\u00e9es d'exp\u00e9rience ?", "type": "select", "options": ["Moins de 2 ans", "2-5 ans", "5-10 ans", "10-15 ans", "15+ ans"]}, {"id": "motivation", "question": "Qu'est-ce qui vous motive \u00e0 explorer une reconversion ?", "type": "textarea", "placeholder": "Parlez-nous de ce qui vous pousse..."}, {"id": "constraints", "question": "Quelles sont vos contraintes principales ?", "type": "buttons", "multiple": true, "options": ["G\u00e9ographiques", "Familiales", "Financi\u00e8res", "Sant\u00e9", "Aucune"]}], "steps": [{"id": 1, "module": "profiling", "title": "Votre premi\u00e8re impression", "type": "reflection", "content": "Imaginez-vous dans 5 ans, dans un emploi qui vous rend vraiment heureux. Que faites-vous ? Comment est votre environnement ?", "instruction": "\u00c9crivez une courte description (2-3 phrases) de cette vision", "tag": "vision"}, {"id": 2, "module": "profiling", "title": "Les moments de flux", "type": "quiz", "content": "Quand perdez-vous le sens du temps au travail ?", "options": [{"text": "En r\u00e9solvant des probl\u00e8mes complexes", "score": {"analytical": 5}}, {"text": "En aidant ou accompagnant quelqu'un", "score": {"empathy": 5}}, {"text": "En cr\u00e9ant ou innovant", "score": {"creativity": 5}}, {"text": "En organisant et structurant", "score": {"organization": 5}}], "tag": "flow"}, {"id": 3, "module": "profiling", "title": "Vos \u00e9nergies naturelles", "type": "slider", "content": "\u00cates-vous plut\u00f4t \u00e9nergis\u00e9 par les interactions avec les gens ou pr\u00e9f\u00e9rez-vous travailler en autonomie ?", "scale": ["Tr\u00e8s social", "\u00c9quilibr\u00e9", "Tr\u00e8s autonome"], "tag": "social_energy"}, {"id": 4, "module": "profiling", "title": "L'\u00e9cole que vous aviez", "type": "reflection", "content": "Quel \u00e9tait votre environnement scolaire id\u00e9al ? Qu'est-ce qui vous rendait fier de vous ?", "instruction": "D\u00e9crivez 2-3 \u00e9l\u00e9ments cl\u00e9s", "tag": "school_memories"}, {"id": 5, "module": "profiling", "title": "Vos points forts \u00e9vidents", "type": "checklist", "content": "S\u00e9lectionnez les 5 qualit\u00e9s qu'on vous reconna\u00eet le plus souvent :", "options": ["Pers\u00e9v\u00e9rance", "Cr\u00e9ativit\u00e9", "Leadership", "\u00c9coute", "Rigueur", "Adaptabilit\u00e9", "Charisme", "Sens de l'humour", "Honn\u00eatet\u00e9", "Strat\u00e9gie"], "tag": "strengths"}, {"id": 6, "module": "profiling", "title": "Ce qui vous frustre au travail", "type": "quiz", "content": "Qu'est-ce qui vous frustre le plus dans votre environnement professionnel actuel ?", "options": [{"text": "Manque d'autonomie", "score": {"autonomy_need": 5}}, {"text": "Absence de sens ou d'impact", "score": {"purpose_need": 5}}, {"text": "Relations difficiles", "score": {"collaboration_need": 5}}, {"text": "Stagnation professionnelle", "score": {"growth_need": 5}}], "tag": "frustrations"}, {"id": 7, "module": "profiling", "title": "Votre mode d'apprentissage", "type": "quiz", "content": "Comment apprenez-vous le mieux ?", "options": [{"text": "En lisant et \u00e9tudiant", "score": {"learning_style": "theoretical"}}, {"text": "En pratiquant et exp\u00e9rimentant", "score": {"learning_style": "practical"}}, {"text": "En discutant avec d'autres", "score": {"learning_style": "social"}}, {"text": "En observant des experts", "score": {"learning_style": "observational"}}], "tag": "learning"}, {"id": 8, "module": "profiling", "title": "Votre rapport au risque", "type": "slider", "content": "Vous \u00eates quelqu'un qui aime prendre des risques ou pr\u00e9f\u00e9rez la stabilit\u00e9 ?", "scale": ["Tr\u00e8s prudent", "\u00c9quilibr\u00e9", "Cherche l'aventure"], "tag": "risk_tolerance"}, {"id": 9, "module": "profiling", "title": "Les r\u00f4les que vous aimez", "type": "checklist", "content": "S\u00e9lectionnez 4 r\u00f4les qui vous attirer :", "options": ["Expert/sp\u00e9cialiste", "Chef de projet", "Coach/mentor", "Innovateur", "Ex\u00e9cuteur", "Strat\u00e8ge", "Artiste", "Chercheur", "Entrepreneur", "Facilitateur"], "tag": "roles"}, {"id": 10, "module": "profiling", "title": "Ce qui vous rendrait vraiment heureux", "type": "ranking", "content": "Classez par ordre d'importance (1=plus important) :", "options": ["L'impact social", "La reconnaissance", "L'autonomie", "La s\u00e9curit\u00e9 financi\u00e8re", "Le bien-\u00eatre personnel", "La cr\u00e9ation", "L'apprentissage continu", "La famille"], "tag": "happiness_drivers"}, {"id": 11, "module": "profiling", "title": "Vos h\u00e9ros professionnels", "type": "reflection", "content": "Qui admirez-vous professionnellement ? Qu'est-ce qui vous attire chez cette personne ?", "instruction": "D\u00e9crivez 1-2 personnes et leurs qualit\u00e9s", "tag": "role_models"}, {"id": 12, "module": "profiling", "title": "Les succ\u00e8s dont vous \u00eates fier", "type": "reflection", "content": "D\u00e9crivez un moment o\u00f9 vous vous \u00eates vraiment senti\u00b7e capable et valoris\u00e9\u00b7e", "instruction": "Qu'avez-vous fait ? Comment vous vous sentiez ?", "tag": "pride_moments"}, {"id": 13, "module": "profiling", "title": "Votre environnement de travail id\u00e9al", "type": "quiz", "content": "Quel environnement vous inspire le plus ?", "options": [{"text": "Bureau moderne et collaboratif", "score": {"environment": "collaborative"}}, {"text": "T\u00e9l\u00e9travail ou bureau tranquille", "score": {"environment": "solitary"}}, {"text": "Terrain, mobilit\u00e9, vari\u00e9t\u00e9", "score": {"environment": "mobile"}}, {"text": "Cr\u00e9atif, d\u00e9cal\u00e9, innovant", "score": {"environment": "creative"}}], "tag": "environment"}, {"id": 14, "module": "profiling", "title": "Votre relation \u00e0 l'argent", "type": "slider", "content": "L'argent est-il votre priorit\u00e9 principale ou plut\u00f4t un \u00e9l\u00e9ment secondaire ?", "scale": ["Tr\u00e8s important", "\u00c9quilibr\u00e9", "Pas la priorit\u00e9"], "tag": "financial_priority"}, {"id": 15, "module": "profiling", "title": "Les valeurs au c\u0153ur de vous", "type": "checklist", "content": "S\u00e9lectionnez les 5 valeurs les plus importantes pour vous :", "options": ["Int\u00e9grit\u00e9", "Libert\u00e9", "S\u00e9curit\u00e9", "Justice sociale", "Famille", "Cr\u00e9ativit\u00e9", "Excellence", "Authenticit\u00e9", "G\u00e9n\u00e9rosit\u00e9", "Ambition"], "tag": "core_values"}, {"id": 16, "module": "competencies", "title": "Cartographie de vos comp\u00e9tences", "type": "reflection", "content": "Listez 10 choses que vous savez faire vraiment bien", "instruction": "Du plus technique au plus humain, tout compte !", "tag": "skills_inventory"}, {"id": 17, "module": "competencies", "title": "Les comp\u00e9tences qui vous manquent", "type": "quiz", "content": "Quelle comp\u00e9tence aimeriez-vous d\u00e9velopper ?", "options": [{"text": "Leadership et gestion de projet", "score": {"skill_gap": "leadership"}}, {"text": "Comp\u00e9tences techniques/digitales", "score": {"skill_gap": "technical"}}, {"text": "Communication et pr\u00e9sentation", "score": {"skill_gap": "communication"}}, {"text": "Gestion financi\u00e8re ou commerciale", "score": {"skill_gap": "business"}}], "tag": "skill_gaps"}, {"id": 18, "module": "competencies", "title": "Les certifications que vous avez", "type": "reflection", "content": "\u00c9num\u00e9rez tous vos dipl\u00f4mes, certifications et formations", "instruction": "Y compris les formations en ligne !", "tag": "certifications"}, {"id": 19, "module": "competencies", "title": "Comp\u00e9tences cach\u00e9es", "type": "checklist", "content": "Cochez les comp\u00e9tences que vous ne valorisez pas assez :", "options": ["R\u00e9solution de probl\u00e8mes", "Gestion du stress", "N\u00e9gociation", "\u00c9coute active", "Vision strat\u00e9gique", "Adaptabilit\u00e9", "Travail en \u00e9quipe", "Gestion du temps", "Cr\u00e9ation de contenu", "Mentorat"], "tag": "hidden_skills"}, {"id": 20, "module": "competencies", "title": "Qu'en disent les autres", "type": "reflection", "content": "Que demandent aux gens quand ils ont besoin de vous dans votre entreprise/r\u00e9seau ?", "instruction": "Observez quelles comp\u00e9tences sont les plus demand\u00e9es", "tag": "peer_feedback"}, {"id": 21, "module": "competencies", "title": "Vos passions en tant que comp\u00e9tences", "type": "reflection", "content": "Y a-t-il des passions (hobbies, b\u00e9n\u00e9volat) qui pourraient devenir des comp\u00e9tences professionnelles ?", "instruction": "Comment pourriez-vous les mon\u00e9tiser ou les valoriser ?", "tag": "passion_skills"}, {"id": 22, "module": "competencies", "title": "L'effet Dunning-Kruger", "type": "quiz", "content": "Comment jugez-vous g\u00e9n\u00e9ralement votre niveau de comp\u00e9tence ?", "options": [{"text": "Je doute souvent de moi, m\u00eame quand j'excelle", "score": {"confidence": "low"}}, {"text": "J'ai une bonne confiance en moi", "score": {"confidence": "medium"}}, {"text": "Je suis tr\u00e8s confiant dans mes capacit\u00e9s", "score": {"confidence": "high"}}], "tag": "confidence"}, {"id": 23, "module": "competencies", "title": "Vos projets r\u00e9ussis", "type": "ranking", "content": "Classez vos 3 plus grands accomplissements professionnels", "options": [], "instruction": "D\u00e9crivez bri\u00e8vement ce qui les a rendus remarquables", "tag": "achievements"}, {"id": 24, "module": "competencies", "title": "Ce que vous ma\u00eetrisez vs apprenez", "type": "slider", "content": "Estimez votre niveau d'expertise actuel", "scale": ["D\u00e9butant", "Interm\u00e9diaire", "Avanc\u00e9", "Expert"], "tag": "expertise_level"}, {"id": 25, "module": "competencies", "title": "Comp\u00e9tences pour demain", "type": "reflection", "content": "Quelles comp\u00e9tences pensez-vous seront essentielles dans 5-10 ans ?", "instruction": "\u00cates-vous pr\u00eat\u00b7e \u00e0 les d\u00e9velopper ?", "tag": "future_skills"}, {"id": 26, "module": "competencies", "title": "Votre empreinte professionnelle", "type": "reflection", "content": "Si quelqu'un cherche une personne pour faire quelque chose d'important, pensez-vous qu'on pense \u00e0 vous ?", "instruction": "Dans quel domaine ?", "tag": "professional_brand"}, {"id": 27, "module": "competencies", "title": "Transf\u00e9rabilit\u00e9 de vos skills", "type": "quiz", "content": "Avez-vous des comp\u00e9tences qui pourraient s'appliquer \u00e0 un secteur compl\u00e8tement diff\u00e9rent ?", "options": [{"text": "Oui, beaucoup", "score": {"transferability": "high"}}, {"text": "Quelques-unes", "score": {"transferability": "medium"}}, {"text": "Non, tr\u00e8s sp\u00e9cialis\u00e9", "score": {"transferability": "low"}}], "tag": "transferability"}, {"id": 28, "module": "competencies", "title": "Les hard skills vs soft skills", "type": "checklist", "content": "O\u00f9 \u00eates-vous particuli\u00e8rement fort\u00b7e ?", "options": ["Technique/IT", "Gestion/Finance", "Communication", "Leadership", "Cr\u00e9ativit\u00e9", "Analyse", "Vente", "RH", "Logistique", "Marketing"], "tag": "skill_categories"}, {"id": 29, "module": "competencies", "title": "Ce qui vous limite", "type": "reflection", "content": "Existe-t-il des comp\u00e9tences ou des peurs qui vous bloquent ?", "instruction": "Que faudrait-il pour les surmonter ?", "tag": "blockers"}, {"id": 30, "module": "competencies", "title": "Portfolio de comp\u00e9tences", "type": "quiz", "content": "Seriez-vous capable de cr\u00e9er un portfolio ou un CV visual de vos comp\u00e9tences ?", "options": [{"text": "Oui, facilement", "score": {"self_awareness": "high"}}, {"text": "Avec de l'aide", "score": {"self_awareness": "medium"}}, {"text": "J'aurais du mal", "score": {"self_awareness": "low"}}], "tag": "self_awareness"}, {"id": 31, "module": "competencies", "title": "Apprendre \u00e0 apprendre", "type": "reflection", "content": "Comment avez-vous acquis vos meilleures comp\u00e9tences ?", "instruction": "Quel \u00e9tait votre approche d'apprentissage ?", "tag": "learning_path"}, {"id": 32, "module": "competencies", "title": "Mentor et coaching", "type": "quiz", "content": "Avez-vous un mentor qui pourrait valider votre bilan de comp\u00e9tences ?", "options": [{"text": "Oui, plusieurs", "score": {"network_strength": "strong"}}, {"text": "Une ou deux personnes", "score": {"network_strength": "medium"}}, {"text": "Pas vraiment", "score": {"network_strength": "weak"}}], "tag": "network"}, {"id": 33, "module": "competencies", "title": "Les d\u00e9fis que vous avez relev\u00e9s", "type": "reflection", "content": "Quel est le plus grand d\u00e9fi professionnel que vous avez surmont\u00e9s ?", "instruction": "Que vous a-t-il appris sur vous-m\u00eame ?", "tag": "resilience"}, {"id": 34, "module": "competencies", "title": "Votre trajectoire de croissance", "type": "slider", "content": "Avez-vous senti une progression claire dans votre carri\u00e8re ?", "scale": ["Stagnation", "Croissance l\u00e9g\u00e8re", "\u00c9volution claire", "Trajectoire remarquable"], "tag": "career_trajectory"}, {"id": 35, "module": "competencies", "title": "Comp\u00e9tences pour votre nouvelle vie", "type": "reflection", "content": "Quelles comp\u00e9tences actuelles voulez-vous absolument garder dans votre nouvelle carri\u00e8re ?", "instruction": "Lesquelles aimeriez-vous laisser de c\u00f4t\u00e9 ?", "tag": "skill_preferences"}, {"id": 36, "module": "values", "title": "Vos valeurs non-n\u00e9gociables", "type": "ranking", "content": "Classez les valeurs les plus importantes pour vous :", "options": ["Autonomie", "S\u00e9curit\u00e9", "Reconnaissance", "Impact social", "Cr\u00e9ativit\u00e9", "\u00c9quilibre vie-travail", "Apprentissage", "Stabilit\u00e9", "Innovation", "Compassion"], "tag": "core_values_ranked"}, {"id": 37, "module": "values", "title": "L'impact que vous voulez avoir", "type": "reflection", "content": "Quel impact aimeriez-vous avoir sur le monde ?", "instruction": "Comment cela se refl\u00e8te dans votre travail ?", "tag": "desired_impact"}, {"id": 38, "module": "values", "title": "Votre \u00e9thique personnelle", "type": "quiz", "content": "Avez-vous d\u00e9j\u00e0 refus\u00e9 une opportunit\u00e9 pour des raisons \u00e9thiques ?", "options": [{"text": "Oui, absolument", "score": {"ethics_priority": "high"}}, {"text": "Peut-\u00eatre, dans certains cas", "score": {"ethics_priority": "medium"}}, {"text": "Rarement", "score": {"ethics_priority": "low"}}], "tag": "ethics"}, {"id": 39, "module": "values", "title": "Contribution et g\u00e9n\u00e9rosit\u00e9", "type": "reflection", "content": "Vers quoi vous sentiriez-vous envie de contribuer b\u00e9n\u00e9volement ?", "instruction": "Qu'est-ce que cela dit de vos valeurs ?", "tag": "contribution"}, {"id": 40, "module": "values", "title": "Votre legacy", "type": "reflection", "content": "Comment aimeriez-vous \u00eatre rem\u00e9mbr\u00e9s professionnellement ?", "instruction": "Quelle trace voulez-vous laisser ?", "tag": "legacy"}, {"id": 41, "module": "values", "title": "Les causes qui vous animent", "type": "checklist", "content": "Quelles causes vous touchent vraiment ?", "options": ["Environnement", "Justice sociale", "Sant\u00e9", "\u00c9ducation", "Pauvret\u00e9", "\u00c9galit\u00e9", "Technologie", "Arts et culture", "D\u00e9veloppement personnel", "Autre"], "tag": "causes"}, {"id": 42, "module": "values", "title": "Votre \u00e9quilibre id\u00e9al", "type": "slider", "content": "Quel \u00e9quilibre travail-vie personnelle cherchez-vous ?", "scale": ["Vie professionnelle prioritaire", "\u00c9quilibr\u00e9", "Vie personnelle prioritaire"], "tag": "work_life_balance"}, {"id": 43, "module": "values", "title": "Les moments de fiert\u00e9", "type": "reflection", "content": "D\u00e9crivez un moment o\u00f9 vous vous sentiez totalement align\u00e9 avec vos valeurs", "instruction": "Comment \u00e9tiez-vous ? Qu'aviez-vous accompli ?", "tag": "alignment_moments"}, {"id": 44, "module": "values", "title": "Vos h\u00e9ros de vie", "type": "reflection", "content": "Qui admirez-vous vraiment ? Pourquoi ?", "instruction": "Qu'est-ce que cela dit de vos valeurs ?", "tag": "life_heroes"}, {"id": 45, "module": "values", "title": "L'argent et le sens", "type": "quiz", "content": "Pour vous, gagner beaucoup d'argent en faisant quelque chose sans sens, c'est acceptable ?", "options": [{"text": "Non, jamais", "score": {"values_priority": "very_high"}}, {"text": "\u00c0 titre temporaire", "score": {"values_priority": "medium"}}, {"text": "Oui, pourquoi pas ?", "score": {"values_priority": "low"}}], "tag": "money_vs_meaning"}, {"id": 46, "module": "values", "title": "Les libert\u00e9s essentielles", "type": "checklist", "content": "Quelles libert\u00e9s sont essentielles pour vous ?", "options": ["Libert\u00e9 de pens\u00e9e", "Libert\u00e9 de d\u00e9cision", "Libert\u00e9 d'horaires", "Libert\u00e9 de localisation", "Libert\u00e9 cr\u00e9ative", "Libert\u00e9 d'expression", "Libert\u00e9 d'apprentissage", "Libert\u00e9 financi\u00e8re"], "tag": "freedoms"}, {"id": 47, "module": "values", "title": "Contribution \u00e0 l'\u00e9quipe", "type": "reflection", "content": "Comment contribuez-vous au-del\u00e0 de votre r\u00f4le officiel ?", "instruction": "Qu'apportez-vous aux autres ?", "tag": "team_contribution"}, {"id": 48, "module": "values", "title": "Vos principes non-n\u00e9gociables", "type": "reflection", "content": "\u00c9num\u00e9rez 3 principes sur lesquels vous ne transigeriez jamais", "instruction": "Peu importe le prix ou les cons\u00e9quences", "tag": "principles"}, {"id": 49, "module": "values", "title": "La version future de vous", "type": "reflection", "content": "Imaginez-vous \u00e0 la retraite, satisfait de votre vie. Pourquoi ?", "instruction": "Quel a \u00e9t\u00e9 le sens de votre travail ?", "tag": "life_fulfillment"}, {"id": 50, "module": "values", "title": "Alignement actuels", "type": "quiz", "content": "\u00cates-vous actuellement align\u00e9 avec vos vraies valeurs ?", "options": [{"text": "Compl\u00e8tement", "score": {"current_alignment": "high"}}, {"text": "Partiellement", "score": {"current_alignment": "medium"}}, {"text": "Pas du tout", "score": {"current_alignment": "low"}}], "tag": "current_alignment"}, {"id": 51, "module": "values", "title": "Les valeurs \u00e0 explorer", "type": "reflection", "content": "Y a-t-il une valeur que vous aimeriez d\u00e9velopper ou explorer ?", "instruction": "Laquelle et pourquoi ?", "tag": "values_to_develop"}, {"id": 52, "module": "values", "title": "Votre d\u00e9finition du succ\u00e8s", "type": "reflection", "content": "Qu'est-ce que le succ\u00e8s signifie r\u00e9ellement pour vous ?", "instruction": "Ce n'est pas la d\u00e9finition traditionnelle, c'est la v\u00f4tre", "tag": "personal_success"}, {"id": 53, "module": "values", "title": "L'inspiration au quotidien", "type": "reflection", "content": "Qu'est-ce qui vous inspire le plus ?", "instruction": "Une personne, une cause, une id\u00e9e ?", "tag": "inspiration"}, {"id": 54, "module": "values", "title": "Les peurs li\u00e9es aux valeurs", "type": "reflection", "content": "Avez-vous des peurs concernant le respect de vos valeurs dans votre carri\u00e8re ?", "instruction": "Lesquelles et pourquoi ?", "tag": "values_fears"}, {"id": 55, "module": "values", "title": "Int\u00e9grit\u00e9 et authenticit\u00e9", "type": "quiz", "content": "Pouvez-vous \u00eatre compl\u00e8tement authentique dans votre travail actuel ?", "options": [{"text": "Oui, totalement", "score": {"authenticity": "high"}}, {"text": "G\u00e9n\u00e9ralement", "score": {"authenticity": "medium"}}, {"text": "Non, je dois me conformer", "score": {"authenticity": "low"}}], "tag": "authenticity"}, {"id": 56, "module": "experiences", "title": "Votre premi\u00e8re vraie victoire", "type": "reflection", "content": "Quel est votre premier succ\u00e8s professionnel m\u00e9morable ?", "instruction": "D\u00e9crivez le contexte et ce que vous avez ressenti", "tag": "first_victory"}, {"id": 57, "module": "experiences", "title": "Les \u00e9checs qui ont fa\u00e7onn\u00e9", "type": "reflection", "content": "Quel \u00e9chec vous a le plus appris sur vous ?", "instruction": "Comment l'avez-vous transform\u00e9 ?", "tag": "transformative_failure"}, {"id": 58, "module": "experiences", "title": "Votre mentor id\u00e9al", "type": "reflection", "content": "Qui vous a le plus aid\u00e9 dans votre d\u00e9veloppement ?", "instruction": "Qu'avez-vous appris de cette personne ?", "tag": "mentors"}, {"id": 59, "module": "experiences", "title": "Les le\u00e7ons de vie professionnelle", "type": "checklist", "content": "S\u00e9lectionnez les le\u00e7ons cl\u00e9s de votre parcours :", "options": ["La pers\u00e9v\u00e9rance paie", "La collaboration est essentielle", "L'adaptabilit\u00e9 est la cl\u00e9", "L'\u00e9coute cr\u00e9e des liens", "L'authenticit\u00e9 gagne", "La curiosit\u00e9 ouvre des portes", "L'\u00e9chec est une opportunit\u00e9", "La passion guide"], "tag": "life_lessons"}, {"id": 60, "module": "experiences", "title": "Les pivots de votre carri\u00e8re", "type": "reflection", "content": "Avez-vous fait des changements majeurs ? Pourquoi ?", "instruction": "\u00c9taient-ce des choix ou des circonstances ?", "tag": "career_pivots"}, {"id": 61, "module": "experiences", "title": "Les collaborations marquantes", "type": "reflection", "content": "Quelle collaboration a \u00e9t\u00e9 la plus enrichissante ?", "instruction": "Ce qui rendait cette \u00e9quipe si sp\u00e9ciale ?", "tag": "collaborations"}, {"id": 62, "module": "experiences", "title": "Les d\u00e9fis relev\u00e9s", "type": "ranking", "content": "Classez vos 3 d\u00e9fis les plus importants", "options": [], "instruction": "Comment les avez-vous g\u00e9r\u00e9s ?", "tag": "challenges_overcome"}, {"id": 63, "module": "experiences", "title": "Les opportunit\u00e9s manqu\u00e9es", "type": "reflection", "content": "Y a-t-il une opportunit\u00e9 dont vous regrettez de ne pas l'avoir saisie ?", "instruction": "Que pourriez-vous apprendre de cela ?", "tag": "missed_opportunities"}, {"id": 64, "module": "experiences", "title": "Les industries ou secteurs explor\u00e9s", "type": "reflection", "content": "\u00c9num\u00e9rez tous les secteurs d'activit\u00e9 que vous avez explor\u00e9", "instruction": "Qu'avez-vous aim\u00e9/d\u00e9test\u00e9 dans chacun ?", "tag": "sectors_explored"}, {"id": 65, "module": "experiences", "title": "Vos r\u00f4les \u00e0 travers le temps", "type": "reflection", "content": "D\u00e9crivez l'\u00e9volution de vos r\u00f4les", "instruction": "Quel mod\u00e8le ou progression voyez-vous ?", "tag": "role_evolution"}, {"id": 66, "module": "experiences", "title": "Les entreprises qui vous ont marqu\u00e9", "type": "reflection", "content": "Quelle entreprise ou organisation vous a le plus influenc\u00e9 ?", "instruction": "Pourquoi ? Qu'avez-vous appris ?", "tag": "impactful_companies"}, {"id": 67, "module": "experiences", "title": "L'apprentissage en action", "type": "reflection", "content": "D\u00e9crivez une comp\u00e9tence que vous avez d\u00e9velopp\u00e9 sur le tas", "instruction": "Comment avez-vous appris sans formation formelle ?", "tag": "on_the_job_learning"}, {"id": 68, "module": "experiences", "title": "Les p\u00e9riodes creuses", "type": "reflection", "content": "Y a-t-il eu des p\u00e9riodes difficiles ou de transition ?", "instruction": "Comment les avez-vous travers\u00e9es ? Qu'en avez-vous tir\u00e9 ?", "tag": "difficult_periods"}, {"id": 69, "module": "experiences", "title": "L'impact sur les autres", "type": "reflection", "content": "Comment avez-vous positivement impact\u00e9 vos coll\u00e8gues ou clients ?", "instruction": "Des histoires concr\u00e8tes ?", "tag": "impact_on_others"}, {"id": 70, "module": "experiences", "title": "Les erreurs m\u00e9morables", "type": "reflection", "content": "Quelle erreur vous a le plus marqu\u00e9 ? Qu'en avez-vous appris ?", "instruction": "Comment l'avez-vous transform\u00e9e en apprentissage ?", "tag": "memorable_mistakes"}, {"id": 71, "module": "experiences", "title": "Votre contribution unique", "type": "reflection", "content": "Ce que vous avez uniquement apport\u00e9 \u00e0 vos organisations", "instruction": "Votre secret sauce ?", "tag": "unique_contribution"}, {"id": 72, "module": "experiences", "title": "L'\u00e9volution de vos motivations", "type": "reflection", "content": "Vos motivations ont-elles chang\u00e9 au cours de votre carri\u00e8re ?", "instruction": "Comment ? Pourquoi ?", "tag": "motivation_evolution"}, {"id": 73, "module": "experiences", "title": "Les cercles d'influence", "type": "reflection", "content": "Qui vous a inspir\u00e9 ou influenc\u00e9 positivement ?", "instruction": "Ces personnes sont votre r\u00e9seau actuel ?", "tag": "influencers"}, {"id": 74, "module": "experiences", "title": "L'exp\u00e9rience formatrice", "type": "reflection", "content": "Y a-t-il une exp\u00e9rience qui a vraiment transform\u00e9 votre vision du travail ?", "instruction": "Comment ?", "tag": "transformative_experience"}, {"id": 75, "module": "experiences", "title": "Votre r\u00e9cit professionnel", "type": "reflection", "content": "Racontez votre histoire professionnelle en quelques paragraphes", "instruction": "Comment cela s'encha\u00eene ? Quel est le fil conducteur ?", "tag": "professional_narrative"}, {"id": 76, "module": "personality", "title": "Votre type de personnalit\u00e9", "type": "quiz", "content": "Selon vous, quel type de personnalit\u00e9 vous correspond le mieux ?", "options": [{"text": "Penseur analytique", "score": {"personality": "analytical"}}, {"text": "Cr\u00e9atif innovant", "score": {"personality": "creative"}}, {"text": "Leader charismatique", "score": {"personality": "leader"}}, {"text": "Empathique bienveillant", "score": {"personality": "empathetic"}}], "tag": "personality_type"}, {"id": 77, "module": "personality", "title": "Votre style de communication", "type": "slider", "content": "Votre style de communication est-il plut\u00f4t direct ou nuanc\u00e9 ?", "scale": ["Tr\u00e8s direct", "\u00c9quilibr\u00e9", "Tr\u00e8s nuanc\u00e9"], "tag": "communication_style"}, {"id": 78, "module": "personality", "title": "\u00c9nergie et introversion", "type": "slider", "content": "\u00cates-vous \u00e9nergis\u00e9 par les gens ou avez-vous besoin de solitude ?", "scale": ["Tr\u00e8s extraverti", "Ambiverti", "Tr\u00e8s introverti"], "tag": "introversion_extroversion"}, {"id": 79, "module": "personality", "title": "Votre sens de l'humour", "type": "reflection", "content": "Comment d\u00e9criveriez-vous votre sens de l'humour ?", "instruction": "Comment cela influence votre travail ?", "tag": "humor"}, {"id": 80, "module": "personality", "title": "Votre r\u00e9silience", "type": "slider", "content": "Face aux difficult\u00e9s, vous \u00eates plut\u00f4t du genre \u00e0 plier ou \u00e0 casser ?", "scale": ["Je plisse", "Je m'adapte", "Je rebondis rapidement"], "tag": "resilience"}, {"id": 81, "module": "personality", "title": "Optimisme vs r\u00e9alisme", "type": "quiz", "content": "Comment vous d\u00e9cririez-vous ?", "options": [{"text": "Optimiste naturel", "score": {"outlook": "optimistic"}}, {"text": "R\u00e9aliste pragmatique", "score": {"outlook": "realistic"}}, {"text": "Prudent par nature", "score": {"outlook": "cautious"}}], "tag": "outlook"}, {"id": 82, "module": "personality", "title": "Votre rapport aux conflits", "type": "quiz", "content": "Comment g\u00e9rez-vous les conflits ?", "options": [{"text": "Je les affronte directement", "score": {"conflict_style": "confrontational"}}, {"text": "Je cherche \u00e0 concilier", "score": {"conflict_style": "collaborative"}}, {"text": "Je pr\u00e9f\u00e8re les \u00e9viter", "score": {"conflict_style": "avoidant"}}], "tag": "conflict_style"}, {"id": 83, "module": "personality", "title": "Votre relation au changement", "type": "slider", "content": "\u00cates-vous un amateur de changement ou un ami de la stabilit\u00e9 ?", "scale": ["Adore le changement", "Adaptatif", "Pr\u00e9f\u00e8re la stabilit\u00e9"], "tag": "change_preference"}, {"id": 84, "module": "personality", "title": "L'organisation personnelle", "type": "quiz", "content": "Comment d\u00e9criveriez-vous votre organisation personnelle ?", "options": [{"text": "Tr\u00e8s structur\u00e9 et planifi\u00e9", "score": {"organization": "high"}}, {"text": "Flexible et adaptable", "score": {"organization": "medium"}}, {"text": "Plut\u00f4t chaotique cr\u00e9atif", "score": {"organization": "low"}}], "tag": "personal_organization"}, {"id": 85, "module": "personality", "title": "Votre sensibilit\u00e9 \u00e9motionnelle", "type": "slider", "content": "\u00cates-vous plut\u00f4t \u00e9motionnellement sensible ou d\u00e9tach\u00e9 ?", "scale": ["Tr\u00e8s sensible", "\u00c9quilibr\u00e9", "Plut\u00f4t sto\u00efque"], "tag": "emotional_sensitivity"}, {"id": 86, "module": "personality", "title": "L'ambition et la satisfaction", "type": "quiz", "content": "\u00cates-vous quelqu'un d'ambitieux ?", "options": [{"text": "Tr\u00e8s ambitieux, toujours en avant", "score": {"ambition": "high"}}, {"text": "Mod\u00e9r\u00e9ment, je me fixe des objectifs", "score": {"ambition": "medium"}}, {"text": "Je ne suis pas tr\u00e8s ambitieux", "score": {"ambition": "low"}}], "tag": "ambition"}, {"id": 87, "module": "personality", "title": "Votre curiosit\u00e9 naturelle", "type": "slider", "content": "\u00cates-vous naturellement curieux et exploratif ?", "scale": ["Pas tr\u00e8s curieux", "Curieux normal", "Tr\u00e8s curieux"], "tag": "curiosity"}, {"id": 88, "module": "personality", "title": "L'autonomie vs collaboration", "type": "slider", "content": "Pr\u00e9f\u00e9rez-vous travailler en solo ou en \u00e9quipe ?", "scale": ["Solo absolument", "\u00c9quilibr\u00e9", "\u00c9quipe toujours"], "tag": "autonomy_preference"}, {"id": 89, "module": "personality", "title": "Votre seuil de frustration", "type": "slider", "content": "\u00cates-vous patient ou facilement frustr\u00e9 ?", "scale": ["Tr\u00e8s patient", "Normal", "Facilement frustr\u00e9"], "tag": "patience"}, {"id": 90, "module": "personality", "title": "L'h\u00e9ritage de votre temp\u00e9rament", "type": "reflection", "content": "Comment votre temp\u00e9rament naturel influence votre carri\u00e8re ?", "instruction": "Quels sont vos superpouces ? Vos d\u00e9fis ?", "tag": "temperament_impact"}, {"id": 91, "module": "exploration", "title": "Les pistes qui vous intriguent", "type": "reflection", "content": "Quels types de travail ou d'environnements vous intriguent ?", "instruction": "Qu'est-ce qui vous attire ? Pourquoi ?", "tag": "intriguing_paths"}, {"id": 92, "module": "exploration", "title": "Votre r\u00eave professionnel", "type": "reflection", "content": "Si vous aviez une baguette magique, quel serait votre emploi id\u00e9al ?", "instruction": "Ne vous limitez pas par la r\u00e9alit\u00e9 maintenant", "tag": "ideal_job"}, {"id": 93, "module": "exploration", "title": "Les obstacles per\u00e7us", "type": "reflection", "content": "Quels sont les obstacles majeurs \u00e0 votre reconversion ?", "instruction": "Comment pourriez-vous les surmonter ?", "tag": "obstacles"}, {"id": 94, "module": "exploration", "title": "Votre timeline r\u00e9aliste", "type": "slider", "content": "Dans combien de temps aimeriez-vous faire cette transition ?", "scale": ["Imm\u00e9diat (0-3 mois)", "Court terme (3-12 mois)", "Moyen terme (1-3 ans)", "Long terme (3+ ans)"], "tag": "transition_timeline"}, {"id": 95, "module": "exploration", "title": "Votre niveau de pr\u00e9paration", "type": "quiz", "content": "Vous sentez-vous pr\u00eat pour cette transition ?", "options": [{"text": "Tout \u00e0 fait, j'ai un plan", "score": {"readiness": "high"}}, {"text": "Partiellement, j'explore", "score": {"readiness": "medium"}}, {"text": "Non, j'en suis au d\u00e9but", "score": {"readiness": "low"}}], "tag": "readiness"}, {"id": 96, "module": "exploration", "title": "Vos ressources disponibles", "type": "checklist", "content": "Cochez les ressources dont vous disposez :", "options": ["Argent pour une formation", "Temps pour apprendre", "Mentor/coach", "R\u00e9seau professionnel", "Famille supportive", "Flexibilit\u00e9 de localisation", "Dipl\u00f4mes existants", "Exp\u00e9rience pertinente"], "tag": "available_resources"}, {"id": 97, "module": "exploration", "title": "Les petits pas concrets", "type": "reflection", "content": "Quel est le petit pas que vous pourriez faire d\u00e8s cette semaine ?", "instruction": "Soyez sp\u00e9cifique et r\u00e9aliste", "tag": "first_step"}, {"id": 98, "module": "exploration", "title": "Vos besoins de soutien", "type": "checklist", "content": "De quel soutien avez-vous besoin ?", "options": ["Coaching professionnel", "Formation", "Validation par les pairs", "Financement", "Espace cr\u00e9atif", "Mentorship", "Communaut\u00e9", "Ressources techniques"], "tag": "support_needs"}, {"id": 99, "module": "exploration", "title": "Votre motivation profonde", "type": "reflection", "content": "Pourquoi cette reconversion est-elle importante pour vous ? Qui serez-vous apr\u00e8s ?", "instruction": "Cette question est cl\u00e9 pour votre motivation \u00e0 long terme", "tag": "deep_motivation"}, {"id": 100, "module": "exploration", "title": "Votre engagement envers vous-m\u00eame", "type": "reflection", "content": "Qu'allez-vous promettre \u00e0 la personne que vous d\u00e9couvrez \u00eatre ?", "instruction": "\u00c9crivez votre manifeste personnel", "tag": "personal_commitment"}], "recommendations": [{"id": 1, "title": "Coach en D\u00e9veloppement Personnel", "description": "Accompagner les autres dans leur transformation et croissance personnelle", "compatibility": 85, "skills_match": ["\u00c9coute", "Leadership", "Communication", "Empathie"], "values_match": ["Impact social", "Apprentissage", "Autonomie"], "avg_salary": "40-70k\u20ac", "growth_potential": "\u00c9lev\u00e9", "action_items": ["Certifier vous-m\u00eame en coaching (ICF, 6-12 mois)", "Rejoindre une communaut\u00e9 de coaches", "Commencer avec des amis ou famille", "D\u00e9velopper une sp\u00e9cialit\u00e9"]}, {"id": 2, "title": "Responsable Innovation", "description": "Piloter la transformation et l'innovation au sein d'une organisation", "compatibility": 78, "skills_match": ["Strat\u00e9gie", "Leadership", "Cr\u00e9ativit\u00e9", "Gestion de projet"], "values_match": ["Cr\u00e9ativit\u00e9", "Impact", "Autonomie"], "avg_salary": "45-75k\u20ac", "growth_potential": "Tr\u00e8s \u00e9lev\u00e9", "action_items": ["Suivre un master en innovation", "Rejoindre un poste interm\u00e9diaire en innovation", "Construire un portfolio de projets innovants", "R\u00e9seau avec les innovateurs"]}, {"id": 3, "title": "Consultant en Strat\u00e9gie RH", "description": "Aider les organisations \u00e0 transformer leur culture et leurs talents", "compatibility": 72, "skills_match": ["Analyse", "Communication", "Strat\u00e9gie", "Leadership"], "values_match": ["Impact social", "Collaboration", "Apprentissage"], "avg_salary": "50-80k\u20ac", "growth_potential": "\u00c9lev\u00e9", "action_items": ["Certification en consulting (optionnel)", "Exp\u00e9rience en cabinet ou interne", "Master sp\u00e9cialis\u00e9 recommand\u00e9", "Portfolio de cas clients"]}, {"id": 4, "title": "Entrepreneur en Impact", "description": "Cr\u00e9er une entreprise align\u00e9e avec vos valeurs et g\u00e9n\u00e9rant un impact positif", "compatibility": 68, "skills_match": ["Cr\u00e9ativit\u00e9", "Leadership", "Vision", "R\u00e9silience"], "values_match": ["Autonomie", "Impact social", "Cr\u00e9ativit\u00e9"], "avg_salary": "Variable", "growth_potential": "Tr\u00e8s \u00e9lev\u00e9 (volatilit\u00e9)", "action_items": ["Clarifier votre mod\u00e8le \u00e9conomique", "Valider l'id\u00e9e avec des clients", "Rejoindre un acc\u00e9l\u00e9rateur", "Construire votre MVP"]}, {"id": 5, "title": "Formateur/Cr\u00e9ateur de Contenu", "description": "Partager votre expertise et inspirer par l'enseignement et le contenu", "compatibility": 65, "skills_match": ["Communication", "P\u00e9dagogie", "Cr\u00e9ativit\u00e9", "Storytelling"], "values_match": ["Impact social", "Libert\u00e9", "Apprentissage"], "avg_salary": "30-60k\u20ac", "growth_potential": "\u00c9lev\u00e9", "action_items": ["Cr\u00e9er votre premi\u00e8re formation/contenu", "Choisir votre plateforme (YouTube, Udemy, etc.)", "Construire votre audience", "Monetiser progressivement"]}], "challenges": ["D\u00e9crivez un succ\u00e8s r\u00e9cent - aussi petit soit-il", "Identifiez une comp\u00e9tence que vous sousestimez", "Listez 3 personnes qui croient en vous", "\u00c9crivez une phrase positive sur vous-m\u00eame", "Identifiez une valeur que vous pouvez vivre cette semaine", "D\u00e9crivez comment vous aidez les autres", "Nommez une peur et une premi\u00e8re action pour la surmonter", "Partagez ce qui vous rend unique", "D\u00e9crivez le meilleur feedback que vous ayez re\u00e7u", "Planifiez une action vers votre r\u00eave"]};
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
