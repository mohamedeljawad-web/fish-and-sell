// ==========================================================
//  FISH AND SELL — jeu de pêche 3D en ligne (par Dylan)
//  Un seul fichier : serveur Node (sans dépendances) + page du jeu
//  Lancer : node "fish-and-sell.js"   (Render : PORT automatique)
// ==========================================================
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = process.env.PORT || 3000;
const DATA_FILE = process.env.DATA_FILE || path.join(__dirname, 'fishandsell-data.json');

// ---------------- DONNÉES DU JEU ----------------
const RARETES = [
  { nom: 'Commun', coul: '#c9c9c9', xp: 5, diff: 1.0 },
  { nom: 'Peu commun', coul: '#5fd35f', xp: 10, diff: 1.3 },
  { nom: 'Rare', coul: '#4aa3ff', xp: 20, diff: 1.7 },
  { nom: 'Épique', coul: '#b45cff', xp: 45, diff: 2.1 },
  { nom: 'Légendaire', coul: '#ffb020', xp: 100, diff: 2.6 },
  { nom: 'Mythique', coul: '#ff4d6d', xp: 250, diff: 3.1 },
  { nom: 'Secret', coul: '#00ffd5', xp: 600, diff: 3.6 }
];
const CHANCES = [50, 25, 13, 7, 3.5, 1.2, 0.3];

// zone : etang / cote / large — moment : jour / nuit / tous — meteo : null ou soleil/nuageux/pluie/brouillard
const POISSONS = [
  // ÉTANG
  { id: 'carpe', nom: 'Carpe Boueuse', r: 0, zone: 'etang', moment: 'tous', meteo: null, kg: [1, 6], prix: 4, coul: '#8a7a4a', taille: 1.0 },
  { id: 'perche', nom: 'Perche Verte', r: 0, zone: 'etang', moment: 'jour', meteo: null, kg: [0.3, 1.5], prix: 12, coul: '#6a9a3a', taille: 0.7 },
  { id: 'gardon', nom: 'Gardon Doré', r: 1, zone: 'etang', moment: 'tous', meteo: null, kg: [0.2, 1], prix: 60, coul: '#d8b040', taille: 0.6 },
  { id: 'brochet', nom: 'Brochet Ronce', r: 2, zone: 'etang', moment: 'tous', meteo: null, kg: [2, 8], prix: 24, coul: '#4a6a3a', taille: 1.3 },
  { id: 'axolotl', nom: 'Axolotl Rose', r: 2, zone: 'etang', moment: 'nuit', meteo: null, kg: [0.1, 0.4], prix: 480, coul: '#f4a0c0', taille: 0.5 },
  { id: 'silure', nom: 'Silure Grognon', r: 3, zone: 'etang', moment: 'nuit', meteo: null, kg: [10, 40], prix: 16, coul: '#5a5040', taille: 1.8 },
  { id: 'koi', nom: 'Carpe Koï Impériale', r: 4, zone: 'etang', moment: 'jour', meteo: 'soleil', kg: [3, 12], prix: 160, coul: '#ff7a30', taille: 1.2 },
  { id: 'esprit', nom: "Esprit de l'Étang", r: 6, zone: 'etang', moment: 'nuit', meteo: 'brouillard', kg: [5, 10], prix: 2700, coul: '#a0f0ff', taille: 1.4 },
  // CÔTE
  { id: 'sardine', nom: 'Sardine Bleue', r: 0, zone: 'cote', moment: 'tous', meteo: null, kg: [0.05, 0.3], prix: 60, coul: '#5a8ad0', taille: 0.5 },
  { id: 'gobie', nom: 'Gobie des Sables', r: 0, zone: 'cote', moment: 'jour', meteo: null, kg: [0.1, 0.5], prix: 30, coul: '#d0b080', taille: 0.5 },
  { id: 'crabe', nom: 'Crabe Corail', r: 1, zone: 'cote', moment: 'tous', meteo: null, kg: [0.3, 2], prix: 30, coul: '#e05030', taille: 0.7 },
  { id: 'bar', nom: 'Bar Argenté', r: 1, zone: 'cote', moment: 'tous', meteo: null, kg: [1, 5], prix: 12, coul: '#c0c8d0', taille: 1.0 },
  { id: 'anchois', nom: 'Anchois de Minuit', r: 1, zone: 'cote', moment: 'nuit', meteo: null, kg: [0.02, 0.1], prix: 600, coul: '#303a70', taille: 0.4 },
  { id: 'raie', nom: 'Raie Tachetée', r: 2, zone: 'cote', moment: 'tous', meteo: null, kg: [4, 15], prix: 13, coul: '#8a7060', taille: 1.4 },
  { id: 'clown', nom: 'Poisson-Clown Rayé', r: 2, zone: 'cote', moment: 'jour', meteo: null, kg: [0.1, 0.3], prix: 600, coul: '#ff8a20', taille: 0.5 },
  { id: 'murene', nom: 'Murène Électrique', r: 3, zone: 'cote', moment: 'tous', meteo: 'pluie', kg: [3, 12], prix: 53, coul: '#d0e030', taille: 1.5 },
  { id: 'poulpe', nom: 'Poulpe Saphir', r: 3, zone: 'cote', moment: 'nuit', meteo: null, kg: [2, 9], prix: 73, coul: '#3050d0', taille: 1.1 },
  { id: 'barracuda', nom: 'Barracuda Fantôme', r: 4, zone: 'cote', moment: 'tous', meteo: 'brouillard', kg: [8, 25], prix: 73, coul: '#d0e0e8', taille: 1.7 },
  { id: 'hippocampe', nom: 'Hippocampe Royal', r: 5, zone: 'cote', moment: 'nuit', meteo: null, kg: [0.1, 0.4], prix: 16000, coul: '#ffd040', taille: 0.6 },
  // LARGE
  { id: 'maquereau', nom: 'Maquereau Rayé', r: 0, zone: 'large', moment: 'tous', meteo: null, kg: [0.3, 2], prix: 8, coul: '#3a7a8a', taille: 0.8 },
  { id: 'thon', nom: 'Petit Thon', r: 0, zone: 'large', moment: 'jour', meteo: null, kg: [2, 8], prix: 3, coul: '#405a90', taille: 1.1 },
  { id: 'lune', nom: 'Poisson-Lune Pâle', r: 1, zone: 'large', moment: 'tous', meteo: null, kg: [5, 30], prix: 2, coul: '#d8d0b0', taille: 1.5 },
  { id: 'espadon', nom: 'Espadon Rouge', r: 2, zone: 'large', moment: 'tous', meteo: null, kg: [20, 80], prix: 2.4, coul: '#c03040', taille: 2.0 },
  { id: 'merou', nom: 'Mérou Grognon', r: 2, zone: 'large', moment: 'tous', meteo: null, kg: [8, 40], prix: 5, coul: '#7a5a3a', taille: 1.6 },
  { id: 'lanterne', nom: 'Poisson-Lanterne', r: 2, zone: 'large', moment: 'nuit', meteo: null, kg: [0.5, 3], prix: 70, coul: '#40e0c0', taille: 0.8 },
  { id: 'thondore', nom: 'Thon Doré', r: 3, zone: 'large', moment: 'jour', meteo: 'soleil', kg: [20, 90], prix: 7.3, coul: '#f0c030', taille: 1.9 },
  { id: 'anguille', nom: 'Anguille Tempête', r: 4, zone: 'large', moment: 'tous', meteo: 'pluie', kg: [5, 20], prix: 96, coul: '#6050a0', taille: 1.7 },
  { id: 'requin', nom: 'Requin-Marteau Royal', r: 4, zone: 'large', moment: 'tous', meteo: null, kg: [80, 300], prix: 6.3, coul: '#708090', taille: 2.6 },
  { id: 'calmar', nom: 'Calmar des Abysses', r: 5, zone: 'large', moment: 'nuit', meteo: null, kg: [30, 120], prix: 53, coul: '#802050', taille: 2.2 },
  { id: 'dragon', nom: 'Dragon de Mer Corail', r: 5, zone: 'large', moment: 'tous', meteo: 'nuageux', kg: [10, 40], prix: 160, coul: '#ff5070', taille: 1.8 },
  { id: 'roi', nom: 'Le Roi des Marées', r: 6, zone: 'large', moment: 'tous', meteo: 'pluie', kg: [200, 600], prix: 50, coul: '#2040a0', taille: 3.0 },
  { id: 'baleine', nom: 'Baleine Étoilée', r: 6, zone: 'large', moment: 'nuit', meteo: null, kg: [500, 1500], prix: 20, coul: '#203060', taille: 3.4 },
  // ÎLE BRAISE (volcan)
  { id: 'cendre', nom: 'Poisson-Cendre', r: 0, zone: 'braise', moment: 'tous', meteo: null, kg: [0.3, 2], prix: 14, coul: '#5a5a5a', taille: 0.7 },
  { id: 'truitebraise', nom: 'Truite de Braise', r: 0, zone: 'braise', moment: 'jour', meteo: null, kg: [0.5, 3], prix: 9, coul: '#d0602a', taille: 0.8 },
  { id: 'carpemagma', nom: 'Carpe Magma', r: 1, zone: 'braise', moment: 'tous', meteo: null, kg: [2, 8], prix: 8, coul: '#ff4a1a', taille: 1.0 },
  { id: 'obsidienne', nom: "Raie d'Obsidienne", r: 2, zone: 'braise', moment: 'tous', meteo: null, kg: [5, 20], prix: 10, coul: '#202028', taille: 1.4 },
  { id: 'salamandre', nom: 'Anguille Salamandre', r: 3, zone: 'braise', moment: 'nuit', meteo: null, kg: [3, 10], prix: 65, coul: '#ff7a00', taille: 1.5 },
  { id: 'phenix', nom: 'Poisson-Phénix', r: 4, zone: 'braise', moment: 'jour', meteo: 'soleil', kg: [4, 12], prix: 150, coul: '#ffb030', taille: 1.2 },
  { id: 'cracheur', nom: 'Dragon Cracheur de Lave', r: 5, zone: 'braise', moment: 'tous', meteo: null, kg: [40, 120], prix: 48, coul: '#c02000', taille: 2.2 },
  { id: 'coeurvolcan', nom: 'Cœur du Volcan', r: 6, zone: 'braise', moment: 'nuit', meteo: null, kg: [20, 60], prix: 600, coul: '#ff2a00', taille: 1.8 },
  // ÎLE GIVRE (glace)
  { id: 'morue', nom: 'Morue des Glaces', r: 0, zone: 'givre', moment: 'tous', meteo: null, kg: [1, 6], prix: 4, coul: '#a0b8c8', taille: 0.9 },
  { id: 'hareng', nom: 'Hareng Gelé', r: 0, zone: 'givre', moment: 'tous', meteo: null, kg: [0.2, 1], prix: 20, coul: '#c8d8e8', taille: 0.6 },
  { id: 'saumon', nom: 'Saumon Polaire', r: 1, zone: 'givre', moment: 'tous', meteo: null, kg: [3, 10], prix: 6, coul: '#f08070', taille: 1.1 },
  { id: 'narval', nom: 'Petit Narval', r: 2, zone: 'givre', moment: 'tous', meteo: null, kg: [20, 60], prix: 3, coul: '#d0d8e0', taille: 1.9 },
  { id: 'cristal', nom: 'Poisson-Cristal', r: 3, zone: 'givre', moment: 'nuit', meteo: null, kg: [0.5, 2], prix: 320, coul: '#a0f0ff', taille: 0.7 },
  { id: 'orque', nom: 'Bébé Orque', r: 4, zone: 'givre', moment: 'tous', meteo: null, kg: [100, 300], prix: 6, coul: '#202028', taille: 2.4 },
  { id: 'aurore', nom: 'Poisson-Aurore', r: 5, zone: 'givre', moment: 'nuit', meteo: null, kg: [2, 6], prix: 1200, coul: '#60ffb0', taille: 1.0 },
  { id: 'leviathan', nom: 'Léviathan des Neiges', r: 6, zone: 'givre', moment: 'tous', meteo: 'brouillard', kg: [300, 800], prix: 32, coul: '#e8f4ff', taille: 3.2 },
  // MARAIS BRUMEUX
  { id: 'chatvase', nom: 'Poisson-Chat Vaseux', r: 0, zone: 'marais', moment: 'tous', meteo: null, kg: [1, 5], prix: 4, coul: '#6a6040', taille: 1.0 },
  { id: 'tetard', nom: 'Têtard Géant', r: 0, zone: 'marais', moment: 'tous', meteo: null, kg: [0.1, 0.6], prix: 30, coul: '#4a5a30', taille: 0.5 },
  { id: 'brocroco', nom: 'Brochet-Crocodile', r: 1, zone: 'marais', moment: 'tous', meteo: null, kg: [3, 12], prix: 5, coul: '#5a6a40', taille: 1.4 },
  { id: 'luciole', nom: 'Poisson-Luciole', r: 2, zone: 'marais', moment: 'nuit', meteo: null, kg: [0.2, 0.8], prix: 220, coul: '#d0ff40', taille: 0.5 },
  { id: 'serpent', nom: 'Serpent des Marais', r: 3, zone: 'marais', moment: 'tous', meteo: 'pluie', kg: [5, 15], prix: 38, coul: '#3a5a20', taille: 1.7 },
  { id: 'sorciere', nom: 'Poisson-Sorcière', r: 4, zone: 'marais', moment: 'tous', meteo: 'brouillard', kg: [2, 8], prix: 240, coul: '#8040a0', taille: 1.0 },
  { id: 'hydre', nom: 'Hydre Moussue', r: 5, zone: 'marais', moment: 'nuit', meteo: null, kg: [30, 90], prix: 65, coul: '#2a6a3a', taille: 2.2 },
  { id: 'roifantome', nom: 'Roi Fantôme du Marais', r: 6, zone: 'marais', moment: 'nuit', meteo: 'brouillard', kg: [50, 150], prix: 200, coul: '#c0ffd0', taille: 2.4 },
  // RÉCIF PERDU
  { id: 'demoiselle', nom: 'Demoiselle Bleue', r: 0, zone: 'recif', moment: 'tous', meteo: null, kg: [0.05, 0.2], prix: 70, coul: '#3080ff', taille: 0.4 },
  { id: 'perroquet', nom: 'Poisson-Perroquet', r: 1, zone: 'recif', moment: 'tous', meteo: null, kg: [1, 4], prix: 14, coul: '#30d0a0', taille: 0.9 },
  { id: 'tortue', nom: 'Tortue Corail', r: 2, zone: 'recif', moment: 'tous', meteo: null, kg: [10, 40], prix: 5, coul: '#609040', taille: 1.3 },
  { id: 'mantaroyale', nom: 'Manta Royale', r: 3, zone: 'recif', moment: 'tous', meteo: null, kg: [80, 250], prix: 2.5, coul: '#304060', taille: 2.2 },
  { id: 'requintigre', nom: 'Requin-Tigre', r: 4, zone: 'recif', moment: 'tous', meteo: null, kg: [150, 400], prix: 4.5, coul: '#808870', taille: 2.6 },
  { id: 'huitre', nom: 'Huître Perle-Lune', r: 5, zone: 'recif', moment: 'nuit', meteo: null, kg: [1, 3], prix: 2000, coul: '#f0f0ff', taille: 0.6 },
  { id: 'kraken', nom: 'Le Petit Kraken', r: 6, zone: 'recif', moment: 'tous', meteo: 'pluie', kg: [300, 900], prix: 28, coul: '#602040', taille: 3.0 }
];
const ZONES = ['etang', 'cote', 'large', 'braise', 'givre', 'marais', 'recif'];
const PMAP = Object.fromEntries(POISSONS.map(p => [p.id, p]));

// lure = vitesse pour que ça morde, control = taille de la barre, resil = résistance, chance = poissons rares
const CANNES = [
  { id: 'bambou', nom: 'Canne en Bambou', prix: 0, niv: 1, lure: 1.0, control: 0.20, resil: 0, chance: 0, coul: '#c8a060', lieu: 'depart' },
  { id: 'pecheur', nom: 'Canne du Pêcheur', prix: 300, niv: 1, lure: 1.15, control: 0.23, resil: 5, chance: 10, coul: '#9a6a3a', lieu: 'depart' },
  { id: 'carbone', nom: 'Canne Carbone', prix: 1500, niv: 3, lure: 1.3, control: 0.26, resil: 10, chance: 25, coul: '#333840', lieu: 'depart' },
  { id: 'corail', nom: 'Canne Corail', prix: 5000, niv: 6, lure: 1.45, control: 0.28, resil: 15, chance: 45, coul: '#ff6f61', lieu: 'depart' },
  { id: 'magma', nom: 'Canne Magma', prix: 9000, niv: 8, lure: 1.5, control: 0.29, resil: 30, chance: 55, coul: '#ff5a1a', lieu: 'braise' },
  { id: 'givre', nom: 'Canne de Givre', prix: 12000, niv: 9, lure: 1.7, control: 0.27, resil: 18, chance: 60, coul: '#9fe0ff', lieu: 'givre' },
  { id: 'tempete', nom: 'Canne Tempête', prix: 15000, niv: 10, lure: 1.6, control: 0.30, resil: 20, chance: 70, coul: '#7a6cff', lieu: 'depart' },
  { id: 'marecage', nom: 'Canne des Marais', prix: 25000, niv: 12, lure: 1.65, control: 0.32, resil: 22, chance: 90, coul: '#4a8a3a', lieu: 'marais' },
  { id: 'abyssale', nom: 'Canne Abyssale', prix: 50000, niv: 15, lure: 1.8, control: 0.33, resil: 25, chance: 110, coul: '#202a60', lieu: 'recif' },
  { id: 'etoile', nom: 'Canne Étoile', prix: 150000, niv: 22, lure: 2.1, control: 0.36, resil: 35, chance: 160, coul: '#ffe066', lieu: 'recif' }
];
const BATEAUX = [
  { id: 'barque', nom: 'Barque', prix: 600, niv: 2, vitesse: 11, virage: 1.4, desc: 'Petite barque en bois, parfaite pour commencer' },
  { id: 'moteur', nom: 'Bateau à moteur', prix: 3500, niv: 5, vitesse: 19, virage: 1.5, desc: 'Plus rapide, avec une petite cabine' },
  { id: 'vedette', nom: 'Vedette rapide', prix: 14000, niv: 10, vitesse: 30, virage: 1.8, desc: 'Fonce sur les vagues !' },
  { id: 'yacht', nom: 'Yacht de luxe', prix: 60000, niv: 16, vitesse: 26, virage: 1.1, desc: 'Grand, beau et confortable' }
];
const BMAP = Object.fromEntries(BATEAUX.map(b => [b.id, b]));
const ENCHANTS = [
  { id: 'chanceux', nom: 'Chanceux', desc: '+40 chance', chance: 40 },
  { id: 'eclair', nom: 'Éclair', desc: 'Ça mord 30 % plus vite', lure: 0.3 },
  { id: 'costaud', nom: 'Costaud', desc: '+20 force', resil: 20 },
  { id: 'large', nom: 'Grande Barre', desc: 'Barre du mini-jeu plus grande', control: 0.04 },
  { id: 'tresor', nom: 'Trésor', desc: 'Poissons vendus 25 % plus cher', valeur: 0.25 },
  { id: 'mutant', nom: 'Mutant', desc: 'Mutations 3 fois plus fréquentes', mut: 3 }
];
const EMAP = Object.fromEntries(ENCHANTS.map(e => [e.id, e]));
const PRIX_RELIQUE = 8000;
const CMAP = Object.fromEntries(CANNES.map(c => [c.id, c]));

const APPATS = [
  { id: 'ver', nom: 'Ver de terre', prix: 15, qte: 10, lure: 0.10, chance: 0, desc: 'Ça mord plus vite' },
  { id: 'crevette', nom: 'Crevette', prix: 50, qte: 10, lure: 0, chance: 20, desc: '+20 chance' },
  { id: 'calmar', nom: 'Morceau de calmar', prix: 180, qte: 10, lure: 0.05, chance: 50, desc: '+50 chance, un peu plus rapide' },
  { id: 'dore', nom: 'Appât Doré', prix: 700, qte: 5, lure: 0.15, chance: 120, desc: '+120 chance, plus rapide' }
];
const AMAP = Object.fromEntries(APPATS.map(a => [a.id, a]));

const TOTEMS = [
  { id: 'soleil', nom: 'Totem Soleil', prix: 2000, desc: 'Fait venir le jour et le beau temps' },
  { id: 'lune', nom: 'Totem Lune', prix: 2000, desc: 'Fait venir la nuit' },
  { id: 'pluie', nom: 'Totem Pluie', prix: 1500, desc: 'Fait tomber la pluie' },
  { id: 'brume', nom: 'Totem Brume', prix: 1500, desc: 'Fait venir le brouillard' }
];
const TMAP = Object.fromEntries(TOTEMS.map(t => [t.id, t]));

const MUTATIONS = [
  { id: 'geant', nom: 'Géant', chance: 0.02, mult: 1, poids: 3 },
  { id: 'albinos', nom: 'Albinos', chance: 0.03, mult: 1.5, poids: 1 },
  { id: 'dore', nom: 'Doré', chance: 0.01, mult: 3, poids: 1 },
  { id: 'arcenciel', nom: 'Arc-en-ciel', chance: 0.003, mult: 6, poids: 1 }
];

const SAC_MAX = 80;
function niveauDe(xp) { return 1 + Math.floor(Math.sqrt(xp / 40)); }
function xpPourNiveau(n) { return (n - 1) * (n - 1) * 40; }

// ---------------- MONDE (heure + météo, pareil pour tout le monde) ----------------
const JOUR_MS = 12 * 60 * 1000; // une journée = 12 minutes
let todOffset = 0;
function heure() { return (((Date.now() + todOffset) % JOUR_MS + JOUR_MS) % JOUR_MS) / JOUR_MS * 24; }
function estJour() { const h = heure(); return h >= 6 && h < 19; }
function mettreHeure(h) {
  const now = Date.now();
  todOffset = ((h / 24 * JOUR_MS - (now % JOUR_MS)) % JOUR_MS + JOUR_MS) % JOUR_MS;
}
mettreHeure(9);
let meteo = 'soleil', meteoFin = Date.now() + 4 * 60000;
let annonces = []; // {t, txt}
function annoncer(txt) { annonces.push({ t: Date.now(), txt }); if (annonces.length > 30) annonces.shift(); }
const TEXTE_METEO = {
  soleil: '☀️ Le soleil brille !', nuageux: '☁️ Le ciel se couvre…',
  pluie: '🌧️ Il commence à pleuvoir ! Des poissons spéciaux sortent…', brouillard: '🌫️ Un brouillard mystérieux tombe…'
};
function majMeteo() {
  if (Date.now() < meteoFin) return;
  const choix = [['soleil', 40], ['nuageux', 25], ['pluie', 20], ['brouillard', 15]];
  let tot = 0; for (const c of choix) tot += c[1];
  let r = Math.random() * tot, m = 'soleil';
  for (const c of choix) { r -= c[1]; if (r <= 0) { m = c[0]; break; } }
  meteoFin = Date.now() + (3 + Math.random() * 3) * 60000;
  if (m !== meteo) { meteo = m; annoncer(TEXTE_METEO[m]); }
}
setInterval(majMeteo, 5000);
let totemCooldown = 0;

// ---------------- SAUVEGARDE ----------------
let DB = { users: {}, tokens: {} };
try { DB = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); } catch (e) { }
DB.users = DB.users || {}; DB.tokens = DB.tokens || {};
for (const k in DB.users) { const u = DB.users[k]; u.bateaux = u.bateaux || []; u.enchants = u.enchants || {}; u.reliques = u.reliques || 0; }
let dirty = false;
function sauver() { dirty = true; }
setInterval(() => {
  if (!dirty) return; dirty = false;
  fs.writeFile(DATA_FILE + '.tmp', JSON.stringify(DB), err => { if (!err) fs.rename(DATA_FILE + '.tmp', DATA_FILE, () => { }); });
}, 3000);

function hash(pass, salt) { return crypto.createHash('sha256').update(salt + ':' + pass).digest('hex'); }
function nouveauJoueur(nom, pass) {
  const salt = crypto.randomBytes(8).toString('hex');
  return {
    nom, salt, pass: hash(pass, salt), argent: 50, xp: 0, gagne: 0, prises: 0,
    cannes: ['bambou'], canne: 'bambou', appats: {}, appat: null, sac: [], carnet: {}, bateaux: [], enchants: {}, reliques: 0, cree: Date.now()
  };
}
function etat(u) {
  return {
    nom: u.nom, argent: u.argent, xp: u.xp, niv: niveauDe(u.xp), xpNiv: xpPourNiveau(niveauDe(u.xp)), xpSuiv: xpPourNiveau(niveauDe(u.xp) + 1),
    cannes: u.cannes, canne: u.canne, appats: u.appats, appat: u.appat, sac: u.sac, carnet: u.carnet, prises: u.prises,
    bateaux: u.bateaux || [], enchants: u.enchants || {}, reliques: u.reliques || 0
  };
}

// ---------------- TIRAGE D'UN POISSON ----------------
function rnd(a, b) { return a + Math.random() * (b - a); }
function tirerPoisson(u, zone) {
  const canne = CMAP[u.canne] || CANNES[0];
  const ench = EMAP[(u.enchants || {})[u.canne]] || {};
  let chance = canne.chance + (ench.chance || 0);
  const ap = u.appat && u.appats[u.appat] > 0 ? AMAP[u.appat] : null;
  if (ap) chance += ap.chance;
  const jour = estJour();
  const ok = p => p.zone === zone && (p.moment === 'tous' || (p.moment === 'jour') === jour) && (!p.meteo || p.meteo === meteo);
  const poids = CHANCES.map((b, i) => b * (1 + chance / 100 * i * 0.35));
  let tot = poids.reduce((a, b) => a + b, 0), r = Math.random() * tot, tier = 0;
  for (let i = 0; i < poids.length; i++) { r -= poids[i]; if (r <= 0) { tier = i; break; } }
  let liste = [];
  for (let t = tier; t >= 0 && !liste.length; t--) liste = POISSONS.filter(p => p.r === t && ok(p));
  if (!liste.length) liste = POISSONS.filter(p => p.zone === zone && p.r === 0);
  const p = liste[Math.floor(Math.random() * liste.length)];
  // poids : plus souvent petit que gros
  let kg = p.kg[0] + (p.kg[1] - p.kg[0]) * Math.pow(Math.random(), 1.6);
  let mut = null, mult = 1;
  for (const m of MUTATIONS) {
    if (Math.random() < m.chance * (1 + chance / 200) * (ench.mut || 1)) { mut = m.id; mult = m.mult; kg *= m.poids; break; }
  }
  kg = Math.round(kg * 100) / 100;
  const valeur = Math.max(1, Math.round(p.prix * kg * mult * (1 + (ench.valeur || 0))));
  if (ap) { u.appats[u.appat]--; if (u.appats[u.appat] <= 0) { delete u.appats[u.appat]; u.appat = null; } }
  return { uid: crypto.randomBytes(6).toString('hex'), id: p.id, kg, mut, valeur };
}

// ---------------- JOUEURS EN LIGNE ----------------
const enLigne = {}; // nom -> {x,y,z,ry,a,b,t,canne}
setInterval(() => { const t = Date.now(); for (const k in enLigne) if (t - enLigne[k].t > 6000) delete enLigne[k]; }, 2000);

// ---------------- API ----------------
function envoyer(res, code, obj) {
  const s = JSON.stringify(obj);
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(s);
}
function lireBody(req) {
  return new Promise(ok => {
    let b = ''; req.on('data', c => { b += c; if (b.length > 20000) req.destroy(); });
    req.on('end', () => { try { ok(JSON.parse(b || '{}')); } catch (e) { ok({}); } });
  });
}
function joueurDe(body) { const nom = DB.tokens[body.token]; return nom ? DB.users[nom.toLowerCase()] : null; }
function monde() { return { h: heure(), meteo, jourMs: JOUR_MS }; }

const routes = {
  '/api/data': async () => [200, { RARETES, POISSONS, CANNES, APPATS, TOTEMS, MUTATIONS, BATEAUX, ENCHANTS, PRIX_RELIQUE, SAC_MAX, monde: monde() }],

  '/api/inscription': async b => {
    const nom = String(b.nom || '').trim(), pass = String(b.pass || '');
    if (!/^[A-Za-z0-9_\-éèêàçÉÈ]{3,16}$/.test(nom)) return [400, { err: 'Pseudo : 3 à 16 lettres ou chiffres' }];
    if (pass.length < 3) return [400, { err: 'Mot de passe trop court (3 minimum)' }];
    if (DB.users[nom.toLowerCase()]) return [400, { err: 'Ce pseudo est déjà pris' }];
    const u = nouveauJoueur(nom, pass); DB.users[nom.toLowerCase()] = u;
    const token = crypto.randomBytes(16).toString('hex'); DB.tokens[token] = nom; sauver();
    return [200, { token, etat: etat(u) }];
  },
  '/api/connexion': async b => {
    const u = DB.users[String(b.nom || '').trim().toLowerCase()];
    if (!u || hash(String(b.pass || ''), u.salt) !== u.pass) return [400, { err: 'Pseudo ou mot de passe incorrect' }];
    const token = crypto.randomBytes(16).toString('hex'); DB.tokens[token] = u.nom; sauver();
    return [200, { token, etat: etat(u) }];
  },
  '/api/moi': async b => { const u = joueurDe(b); if (!u) return [401, { err: 'Reconnecte-toi' }]; return [200, { etat: etat(u) }]; },

  '/api/sync': async b => {
    const u = joueurDe(b); if (!u) return [401, { err: 'Reconnecte-toi' }];
    const n = x => (typeof x === 'number' && isFinite(x) ? Math.round(x * 100) / 100 : 0);
    const bt = b.bt && BMAP[b.bt.t] ? { t: b.bt.t, x: n(b.bt.x), z: n(b.bt.z), ry: n(b.bt.ry), on: !!b.bt.on } : null;
    enLigne[u.nom] = { x: n(b.x), y: n(b.y), z: n(b.z), ry: n(b.ry), a: String(b.a || '').slice(0, 10), b: Array.isArray(b.b) ? b.b.slice(0, 3).map(n) : null, t: Date.now(), canne: u.canne, rod: b.rod !== false, bt };
    const autres = [];
    for (const k in enLigne) if (k !== u.nom) { const o = enLigne[k]; autres.push({ nom: k, x: o.x, y: o.y, z: o.z, ry: o.ry, a: o.a, b: o.b, canne: o.canne, rod: o.rod, bt: o.bt }); }
    const depuis = Number(b.depuis) || 0;
    return [200, { autres, monde: monde(), annonces: annonces.filter(a => a.t > depuis), now: Date.now() }];
  },

  '/api/touche': async b => {
    const u = joueurDe(b); if (!u) return [401, { err: 'Reconnecte-toi' }];
    if (u.sac.length >= SAC_MAX) return [400, { err: 'Ton sac est plein ! Va vendre tes poissons au Marchand.' }];
    const zone = ZONES.includes(b.zone) ? b.zone : 'cote';
    u.enCours = tirerPoisson(u, zone); u.enCoursT = Date.now(); sauver();
    const p = PMAP[u.enCours.id];
    return [200, { r: p.r, etat: etat(u) }]; // on ne dit pas quel poisson avant de l'attraper !
  },
  '/api/prise': async b => {
    const u = joueurDe(b); if (!u) return [401, { err: 'Reconnecte-toi' }];
    const f = u.enCours; u.enCours = null;
    if (!f || Date.now() - u.enCoursT > 120000) return [400, { err: 'Trop tard…' }];
    if (!b.ok) { sauver(); return [200, { rate: true, id: f.id, etat: etat(u) }]; }
    const p = PMAP[f.id];
    u.sac.push(f); u.prises++;
    const nouveau = !u.carnet[f.id];
    const c = u.carnet[f.id] || { n: 0, max: 0 }; c.n++; if (f.kg > c.max) c.max = f.kg; u.carnet[f.id] = c;
    const avant = niveauDe(u.xp); u.xp += RARETES[p.r].xp; const apres = niveauDe(u.xp);
    sauver();
    if (p.r >= 4) annoncer('🎣 ' + u.nom + ' a attrapé un(e) ' + p.nom + ' (' + RARETES[p.r].nom + ') !');
    return [200, { poisson: f, nouveau, niveauUp: apres > avant ? apres : 0, etat: etat(u) }];
  },

  '/api/vendre': async b => {
    const u = joueurDe(b); if (!u) return [401, { err: 'Reconnecte-toi' }];
    let garde = [], total = 0, n = 0;
    const max = typeof b.rareteMax === 'number' ? b.rareteMax : 99;
    const ids = Array.isArray(b.uids) ? new Set(b.uids) : null;
    for (const f of u.sac) {
      const p = PMAP[f.id];
      const vend = !f.lock && (ids ? ids.has(f.uid) : (p && p.r <= max));
      if (vend) { total += f.valeur; n++; } else garde.push(f);
    }
    u.sac = garde; u.argent += total; u.gagne += total; sauver();
    return [200, { total, n, etat: etat(u) }];
  },
  '/api/acheter': async b => {
    const u = joueurDe(b); if (!u) return [401, { err: 'Reconnecte-toi' }];
    const niv = niveauDe(u.xp);
    if (b.type === 'canne') {
      const c = CMAP[b.id]; if (!c) return [400, { err: 'Canne inconnue' }];
      if (u.cannes.includes(c.id)) return [400, { err: 'Tu as déjà cette canne' }];
      if (niv < c.niv) return [400, { err: 'Il faut être niveau ' + c.niv }];
      if (u.argent < c.prix) return [400, { err: "Pas assez d'argent" }];
      u.argent -= c.prix; u.cannes.push(c.id); u.canne = c.id; sauver();
      return [200, { etat: etat(u) }];
    }
    if (b.type === 'appat') {
      const a = AMAP[b.id]; if (!a) return [400, { err: 'Appât inconnu' }];
      if (u.argent < a.prix) return [400, { err: "Pas assez d'argent" }];
      u.argent -= a.prix; u.appats[a.id] = (u.appats[a.id] || 0) + a.qte; if (!u.appat) u.appat = a.id; sauver();
      return [200, { etat: etat(u) }];
    }
    if (b.type === 'bateau') {
      const bt = BMAP[b.id]; if (!bt) return [400, { err: 'Bateau inconnu' }];
      if (u.bateaux.includes(bt.id)) return [400, { err: 'Tu as déjà ce bateau' }];
      if (niv < bt.niv) return [400, { err: 'Il faut être niveau ' + bt.niv }];
      if (u.argent < bt.prix) return [400, { err: "Pas assez d'argent" }];
      u.argent -= bt.prix; u.bateaux.push(bt.id); sauver();
      return [200, { etat: etat(u) }];
    }
    if (b.type === 'relique') {
      if (u.argent < PRIX_RELIQUE) return [400, { err: "Pas assez d'argent" }];
      u.argent -= PRIX_RELIQUE; u.reliques = (u.reliques || 0) + 1; sauver();
      return [200, { etat: etat(u) }];
    }
    if (b.type === 'totem') {
      const t = TMAP[b.id]; if (!t) return [400, { err: 'Totem inconnu' }];
      if (Date.now() < totemCooldown) return [400, { err: 'Les totems se reposent… réessaie dans ' + Math.ceil((totemCooldown - Date.now()) / 1000) + ' s' }];
      if (u.argent < t.prix) return [400, { err: "Pas assez d'argent" }];
      u.argent -= t.prix; totemCooldown = Date.now() + 60000;
      if (t.id === 'soleil') { mettreHeure(8); meteo = 'soleil'; meteoFin = Date.now() + 5 * 60000; }
      if (t.id === 'lune') { mettreHeure(20.5); }
      if (t.id === 'pluie') { meteo = 'pluie'; meteoFin = Date.now() + 5 * 60000; }
      if (t.id === 'brume') { meteo = 'brouillard'; meteoFin = Date.now() + 5 * 60000; }
      annoncer('🗿 ' + u.nom + ' a utilisé le ' + t.nom + ' !'); sauver();
      return [200, { etat: etat(u), monde: monde() }];
    }
    return [400, { err: '?' }];
  },
  '/api/equiper': async b => {
    const u = joueurDe(b); if (!u) return [401, { err: 'Reconnecte-toi' }];
    if (b.type === 'canne' && u.cannes.includes(b.id)) u.canne = b.id;
    if (b.type === 'appat') u.appat = (b.id && u.appats[b.id] > 0) ? b.id : null;
    sauver(); return [200, { etat: etat(u) }];
  },
  '/api/enchanter': async b => {
    const u = joueurDe(b); if (!u) return [401, { err: 'Reconnecte-toi' }];
    if (!(u.reliques > 0)) return [400, { err: "Il te faut une Pierre d'Enchantement" }];
    const actuel = u.enchants[u.canne];
    const liste = ENCHANTS.filter(e => e.id !== actuel);
    const e = liste[Math.floor(Math.random() * liste.length)];
    u.reliques--; u.enchants[u.canne] = e.id; sauver();
    return [200, { enchant: e.id, etat: etat(u) }];
  },
  '/api/evaluer': async b => {
    const u = joueurDe(b); if (!u) return [401, { err: 'Reconnecte-toi' }];
    const f = u.sac.find(q => q.uid === b.uid); if (!f) return [400, { err: 'Poisson introuvable' }];
    const p = PMAP[f.id]; const prix = Math.max(50, Math.round(f.valeur * 0.2));
    if (u.argent < prix) return [400, { err: "Pas assez d'argent (" + prix + ' $)' }];
    u.argent -= prix;
    let kg = p.kg[0] + (p.kg[1] - p.kg[0]) * Math.pow(Math.random(), 1.3);
    let mut = null, mult = 1;
    for (const m of MUTATIONS) if (Math.random() < m.chance * 2.5) { mut = m.id; mult = m.mult; kg *= m.poids; break; }
    const ench = EMAP[(u.enchants || {})[u.canne]] || {};
    f.kg = Math.round(kg * 100) / 100; f.mut = mut; f.valeur = Math.max(1, Math.round(p.prix * f.kg * mult * (1 + (ench.valeur || 0))));
    sauver();
    return [200, { poisson: f, prix, etat: etat(u) }];
  },
  '/api/verrou': async b => {
    const u = joueurDe(b); if (!u) return [401, { err: 'Reconnecte-toi' }];
    const f = u.sac.find(q => q.uid === b.uid); if (!f) return [400, { err: 'Poisson introuvable' }];
    f.lock = !f.lock; sauver(); return [200, { etat: etat(u) }];
  },
  '/api/classement': async () => {
    const l = Object.values(DB.users).map(u => ({ nom: u.nom, gagne: u.gagne || 0, niv: niveauDe(u.xp), prises: u.prises || 0 }))
      .sort((a, b) => b.gagne - a.gagne).slice(0, 15);
    return [200, { liste: l }];
  }
};

const server = http.createServer(async (req, res) => {
  const url = req.url.split('?')[0];
  if (req.method === 'GET' && (url === '/' || url === '/index.html')) {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    return res.end(pageDuJeu());
  }
  if (routes[url]) {
    try { const b = req.method === 'POST' ? await lireBody(req) : {}; const [c, o] = await routes[url](b); return envoyer(res, c, o); }
    catch (e) { console.error(e); return envoyer(res, 500, { err: 'Erreur serveur' }); }
  }
  res.writeHead(404); res.end('404');
});
server.listen(PORT, () => console.log('🎣 Fish and Sell en ligne sur le port ' + PORT));

// ================= PAGE DU JEU =================
function pageDuJeu() { return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<title>Fish and Sell</title>
<style>
*{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent}
html,body{width:100%;height:100%;overflow:hidden;background:#0b2340;font-family:'Segoe UI',Tahoma,Arial,sans-serif;color:#fff;user-select:none;-webkit-user-select:none}
canvas{position:fixed;inset:0;width:100%;height:100%;display:block;touch-action:none}
.hide{display:none!important}
.txt{text-shadow:0 2px 0 #0008,0 0 6px #0006}
#login{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:radial-gradient(circle at 50% 30%,#1f7fb8,#0b2340 70%);z-index:50}
#login .box{width:min(92vw,380px);background:#ffffff14;border:2px solid #ffffff30;border-radius:22px;padding:28px;backdrop-filter:blur(6px);text-align:center}
#logo{font-size:44px;font-weight:900;letter-spacing:1px;line-height:1;color:#ffd84a;text-shadow:0 4px 0 #b86b00,0 8px 16px #0008;margin-bottom:6px}
#logo span{color:#5fe0ff;text-shadow:0 4px 0 #0a6a9a,0 8px 16px #0008}
#login .sous{opacity:.85;margin-bottom:20px}
#login input{width:100%;padding:13px 14px;border-radius:12px;border:none;margin:6px 0;font-size:17px;background:#fff;color:#123}
.btn{display:inline-block;border:none;border-radius:12px;padding:11px 16px;font-size:16px;font-weight:800;cursor:pointer;color:#fff;background:#2b9be0;box-shadow:0 4px 0 #136a9e;transition:transform .05s}
.btn:active{transform:translateY(3px);box-shadow:0 1px 0 #136a9e}
.btn.vert{background:#3fbf55;box-shadow:0 4px 0 #23812f}
.btn.jaune{background:#f2b51d;box-shadow:0 4px 0 #a67700;color:#3a2600}
.btn.rouge{background:#e5484d;box-shadow:0 4px 0 #9b2124}
.btn.gris{background:#59646f;box-shadow:0 4px 0 #353d45}
.btn[disabled]{opacity:.45;pointer-events:none}
#login .btn{width:100%;margin-top:8px}
#lmsg{min-height:22px;margin-top:10px;color:#ffd0d0;font-weight:700}
#hud{position:fixed;left:12px;top:12px;z-index:5;pointer-events:none}
#argent{font-size:28px;font-weight:900;color:#7dff8a}
#niv{font-weight:800;margin-top:2px}
#xpbar{width:190px;height:10px;border-radius:6px;background:#0007;margin-top:4px;overflow:hidden;border:1px solid #fff4}
#xpbar div{height:100%;background:linear-gradient(90deg,#5fe0ff,#2b9be0);width:0}
#hudR{position:fixed;right:12px;top:12px;z-index:5;text-align:right;pointer-events:none}
#heure{font-size:22px;font-weight:900}
#meteo,#zone,#appatInfo{font-weight:700;opacity:.95}
#btns{position:fixed;right:12px;bottom:12px;z-index:6;display:flex;gap:8px}
#btns .btn{padding:10px 12px;font-size:15px}
#prompt{position:fixed;left:50%;bottom:140px;transform:translateX(-50%);background:#000a;padding:10px 18px;border-radius:12px;font-weight:800;z-index:6;cursor:pointer;border:2px solid #fff5}
#aide{position:fixed;left:12px;bottom:12px;font-size:13px;opacity:.85;z-index:4;max-width:60vw;pointer-events:none}
#power{position:fixed;left:50%;top:50%;transform:translate(70px,-50%);width:22px;height:160px;background:#0008;border:3px solid #fff;border-radius:12px;overflow:hidden;z-index:6}
#power div{position:absolute;bottom:0;left:0;right:0;background:linear-gradient(0deg,#3fbf55,#f2b51d,#e5484d)}
#reel{position:fixed;left:50%;bottom:90px;transform:translateX(-50%);width:min(560px,90vw);z-index:7;text-align:center}
#reelNom{font-weight:900;font-size:18px;margin-bottom:6px}
#track{position:relative;height:56px;background:linear-gradient(180deg,#0d3d66,#0a2845);border:3px solid #fff;border-radius:14px;overflow:hidden}
#pbar{position:absolute;left:3px;top:4px;bottom:4px;background:#ffffff40;border:3px solid #9cf;border-radius:10px;will-change:transform;transition:background .15s,border-color .15s}
#pbar.in{background:#7dff8a55;border-color:#7dff8a}
#ficon{position:absolute;left:3px;top:9px;width:36px;height:36px;margin-left:-18px;font-size:30px;line-height:36px;text-align:center;filter:drop-shadow(0 2px 2px #000);will-change:transform}
#prog{height:14px;margin-top:8px;background:#0008;border:2px solid #fff;border-radius:8px;overflow:hidden}
#prog div{height:100%;background:linear-gradient(90deg,#e5484d,#f2b51d,#3fbf55);width:30%}
#reelAide{font-size:13px;margin-top:5px;opacity:.9}
.shake{position:fixed;z-index:8;width:92px;height:92px;margin:-46px 0 0 -46px;border-radius:50%;background:radial-gradient(circle,#fff 0,#ffe066 45%,#f2a71d 100%);border:4px solid #fff;color:#5a3a00;font-weight:900;font-size:17px;display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 0 22px #ffd84a;animation:pop .25s}
@keyframes pop{from{transform:scale(.3)}to{transform:scale(1)}}
#toasts{position:fixed;top:90px;left:50%;transform:translateX(-50%);z-index:20;display:flex;flex-direction:column;align-items:center;gap:6px;pointer-events:none;width:90vw}
.toast{background:#000b;padding:9px 16px;border-radius:12px;font-weight:700;border:2px solid #fff3;animation:pop .2s;text-align:center}
#prise{position:fixed;left:50%;top:22%;transform:translateX(-50%);z-index:21;background:#000c;border-radius:18px;padding:16px 26px;text-align:center;border:3px solid #fff;min-width:260px;animation:pop .25s;pointer-events:none}
#prise .r{font-weight:900;font-size:15px;letter-spacing:1px;text-transform:uppercase}
#prise .n{font-weight:900;font-size:26px;margin:2px 0}
#prise .d{font-size:17px}
#prise .new{color:#ffe066;font-weight:900}
.label{position:fixed;transform:translate(-50%,-100%);font-weight:800;font-size:14px;white-space:nowrap;pointer-events:none;z-index:3;text-shadow:0 2px 0 #000,0 0 4px #000}
.label.npc{color:#ffe066;font-size:15px}
.excl{position:fixed;transform:translate(-50%,-100%);font-size:44px;font-weight:900;color:#ffe066;text-shadow:0 3px 0 #b86b00,0 0 10px #000;z-index:4;pointer-events:none}
#panel{position:fixed;inset:0;z-index:30;display:flex;align-items:center;justify-content:center;background:#0006}
#panel .win{width:min(94vw,640px);max-height:86vh;display:flex;flex-direction:column;background:linear-gradient(180deg,#1b5f8f,#123e60);border:3px solid #ffffff60;border-radius:20px;box-shadow:0 20px 50px #000a;overflow:hidden}
#panel .tete{display:flex;align-items:center;justify-content:space-between;padding:14px 16px;background:#0003}
#ptitre{font-size:22px;font-weight:900}
#pcont{overflow:auto;padding:12px 14px 16px}
.row{display:flex;align-items:center;gap:10px;background:#ffffff12;border-radius:12px;padding:9px 10px;margin:6px 0}
.row .ic{font-size:26px;width:38px;text-align:center}
.row .info{flex:1;min-width:0}
.row .t{font-weight:800}
.row .s{font-size:13px;opacity:.85}
.stat{display:inline-block;margin-right:8px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:8px}
.card{background:#ffffff12;border-radius:12px;padding:9px;text-align:center;border:2px solid transparent}
.card .t{font-weight:800;font-size:14px}
.card .s{font-size:12px;opacity:.85}
.tabs{display:flex;gap:6px;margin-bottom:8px;flex-wrap:wrap}
#mob{display:none}
.touch #mob{display:block}
.touch #aide{display:none}
#joy{position:fixed;left:24px;bottom:24px;width:130px;height:130px;border-radius:50%;background:#ffffff1c;border:2px solid #ffffff50;z-index:6}
#joyK{position:absolute;left:50%;top:50%;width:56px;height:56px;margin:-28px;border-radius:50%;background:#ffffff70}
#bCast{position:fixed;right:24px;bottom:90px;width:96px;height:96px;border-radius:50%;z-index:6;font-size:15px;background:#3fbf55;box-shadow:0 5px 0 #23812f}
#bE{position:fixed;right:132px;bottom:100px;width:70px;height:70px;border-radius:50%;z-index:6}
#hotbar{position:fixed;left:50%;bottom:12px;transform:translateX(-50%);z-index:6;display:flex;gap:6px}
.slot{position:relative;width:64px;height:64px;border-radius:12px;background:#0008;border:3px solid #ffffff40;font-size:28px;display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer}
.slot.on{border-color:#ffe066;background:#3a3000b0;box-shadow:0 0 12px #ffe06688}
.slot .k{position:absolute;left:5px;top:2px;font-size:12px;font-weight:900}
.slot .n{font-size:11px;font-weight:800;margin-top:-2px}
.label.ile{color:#fff;font-size:17px;font-weight:900;opacity:.95}
#bSaut{position:fixed;right:132px;bottom:20px;width:70px;height:70px;border-radius:50%;z-index:6;font-size:26px}
.touch #hotbar{bottom:auto;top:84px}
#loading{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:800;background:#0b2340;z-index:60}
</style>
</head>
<body>
<canvas id="c"></canvas>
<div id="loading">Chargement de l'île… 🎣</div>

<div id="login" class="hide"><div class="box">
  <div id="logo">FISH <span>&amp;</span> SELL</div>
  <div class="sous">Pêche, vends, deviens le meilleur pêcheur !</div>
  <input id="lnom" placeholder="Pseudo" maxlength="16" autocomplete="username">
  <input id="lpass" type="password" placeholder="Mot de passe" autocomplete="current-password">
  <button class="btn vert" id="bJouer">▶ JOUER</button>
  <button class="btn" id="bCreer">✨ Créer un compte</button>
  <div id="lmsg"></div>
</div></div>

<div id="jeu" class="hide">
  <div id="hud" class="txt"><div id="argent">0 $</div><div id="niv">Niveau 1</div><div id="xpbar"><div></div></div></div>
  <div id="hudR" class="txt"><div id="heure">08:00</div><div id="meteo">☀️ Soleil</div><div id="zone"></div><div id="appatInfo"></div></div>
  <div id="btns">
    <button class="btn" id="bSac">🎒 Sac</button>
    <button class="btn jaune" id="bCarnet">📖 Carnet</button>
    <button class="btn" id="bCarte">🗺️</button>
    <button class="btn gris" id="bTop">🏆</button>
  </div>
  <div id="aide" class="txt">ZQSD : bouger • ESPACE : sauter • Shift : courir • Clic droit + glisser : caméra • Molette : zoom<br>Clic gauche maintenu : lancer • 1 : sortir/ranger la canne • E : parler / bateau • R : ramener • M : carte</div>
  <div id="hotbar"><div class="slot on" id="slot1"><span class="k">1</span>🎣<div class="n">Canne</div></div></div>
  <div id="prompt" class="hide"></div>
  <div id="power" class="hide"><div></div></div>
  <div id="reel" class="hide txt">
    <div id="reelNom">???</div>
    <div id="track"><div id="pbar"></div><div id="ficon">🐟</div></div>
    <div id="prog"><div></div></div>
    <div id="reelAide">Maintiens le clic (ou ESPACE) pour garder le poisson dans la barre !</div>
  </div>
  <div id="mob">
    <div id="joy"><div id="joyK"></div></div>
    <button class="btn" id="bE">E</button>
    <button class="btn jaune" id="bSaut">⤴</button>
    <button class="btn" id="bCast">🎣<br>PÊCHER</button>
  </div>
</div>
<div id="labels"></div>
<div id="toasts"></div>
<div id="prise" class="hide"></div>
<div id="panel" class="hide"><div class="win">
  <div class="tete"><div id="ptitre">Titre</div><button class="btn rouge" id="pclose">✕</button></div>
  <div id="pcont"></div>
</div></div>

<script>
'use strict';
// =====================================================================
//  OUTILS
// =====================================================================
const $ = id => document.getElementById(id);
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const hex = h => { h = h.replace('#', ''); return [parseInt(h.slice(0, 2), 16) / 255, parseInt(h.slice(2, 4), 16) / 255, parseInt(h.slice(4, 6), 16) / 255]; };
const mixc = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
const fmt = n => Math.floor(n).toLocaleString('fr-FR') + ' $';
function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
if (isTouch) document.body.classList.add('touch');

// ---------- matrices (colonnes) ----------
const M4 = {
  id() { return new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]); },
  mul(a, b) { const o = new Float32Array(16); for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) { let s = 0; for (let k = 0; k < 4; k++) s += a[k * 4 + r] * b[c * 4 + k]; o[c * 4 + r] = s; } return o; },
  T(x, y, z) { const m = M4.id(); m[12] = x; m[13] = y; m[14] = z; return m; },
  S(x, y, z) { const m = M4.id(); m[0] = x; m[5] = y === undefined ? x : y; m[10] = z === undefined ? x : z; return m; },
  Ry(a) { const c = Math.cos(a), s = Math.sin(a); return new Float32Array([c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, 0, 0, 0, 1]); },
  Rx(a) { const c = Math.cos(a), s = Math.sin(a); return new Float32Array([1, 0, 0, 0, 0, c, s, 0, 0, -s, c, 0, 0, 0, 0, 1]); },
  Rz(a) { const c = Math.cos(a), s = Math.sin(a); return new Float32Array([c, s, 0, 0, -s, c, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]); },
  persp(f, a, n, fa) { const t = 1 / Math.tan(f / 2); return new Float32Array([t / a, 0, 0, 0, 0, t, 0, 0, 0, 0, (fa + n) / (n - fa), -1, 0, 0, 2 * fa * n / (n - fa), 0]); },
  look(e, c, u) {
    let zx = e[0] - c[0], zy = e[1] - c[1], zz = e[2] - c[2]; let l = Math.hypot(zx, zy, zz); zx /= l; zy /= l; zz /= l;
    let xx = u[1] * zz - u[2] * zy, xy = u[2] * zx - u[0] * zz, xz = u[0] * zy - u[1] * zx; l = Math.hypot(xx, xy, xz); xx /= l; xy /= l; xz /= l;
    const yx = zy * xz - zz * xy, yy = zz * xx - zx * xz, yz = zx * xy - zy * xx;
    return new Float32Array([xx, yx, zx, 0, xy, yy, zy, 0, xz, yz, zz, 0, -(xx * e[0] + xy * e[1] + xz * e[2]), -(yx * e[0] + yy * e[1] + yz * e[2]), -(zx * e[0] + zy * e[1] + zz * e[2]), 1]);
  },
  pt(m, x, y, z) { return [m[0] * x + m[4] * y + m[8] * z + m[12], m[1] * x + m[5] * y + m[9] * z + m[13], m[2] * x + m[6] * y + m[10] * z + m[14]]; },
  chain(...ms) { let o = ms[0]; for (let i = 1; i < ms.length; i++) o = M4.mul(o, ms[i]); return o; }
};

// =====================================================================
//  MOTEUR 3D (WebGL, fait maison)
// =====================================================================
const cv = $('c');
const gl = cv.getContext('webgl', { antialias: true }) || cv.getContext('experimental-webgl');
if (!gl) { document.body.innerHTML = '<div style="padding:40px;font-size:22px">Ton appareil ne supporte pas la 3D (WebGL) 😢</div>'; throw new Error('no webgl'); }
const VS = \`
attribute vec3 p;attribute vec3 n;attribute vec3 c;
uniform mat4 vp;uniform mat4 m;uniform float wave;uniform float t;uniform float ps;
varying vec3 vc;varying vec3 vn;varying vec3 vw;
void main(){
  vec4 w=m*vec4(p,1.0);
  vec3 nn=(m*vec4(n,0.0)).xyz;
  if(wave>0.5){
    float a=w.x*0.35+t*1.3, b=w.z*0.3+t*1.1, d=(w.x+w.z)*0.6+t*2.0;
    w.y+=sin(a)*0.13+cos(b)*0.13+sin(d)*0.04;
    float dx=cos(a)*0.35*0.13+cos(d)*0.6*0.04, dz=-sin(b)*0.3*0.13+cos(d)*0.6*0.04;
    nn=vec3(-dx,1.0,-dz);
  }
  vw=w.xyz;vn=nn;vc=c;
  gl_PointSize=ps;
  gl_Position=vp*w;
}\`;
const FS = \`
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform vec3 sunDir;uniform vec3 sunCol;uniform vec3 amb;uniform vec3 fogCol;uniform vec3 cam;uniform vec3 tint;
uniform float fogN;uniform float fogF;uniform float wave;uniform float unlit;uniform float nofog;uniform float alpha;uniform float t;
varying vec3 vc;varying vec3 vn;varying vec3 vw;
void main(){
  vec3 base=vc*tint;
  vec3 col;
  if(unlit>0.5){col=base;}
  else{
    vec3 N=normalize(vn);
    float d=max(dot(N,sunDir),0.0);
    col=base*(amb+sunCol*d);
    if(wave>0.5){
      vec3 V=normalize(cam-vw);
      vec3 H=normalize(V+sunDir);
      float s=pow(max(dot(N,H),0.0),70.0);
      float fr=pow(1.0-max(dot(N,V),0.0),3.0);
      col=mix(col,fogCol*0.9,fr*0.55)+sunCol*s*0.9;
      float sp=sin(vw.x*1.7+t*2.3)*sin(vw.z*1.9-t*1.7);
      col+=vec3(0.06)*smoothstep(0.85,1.0,sp)*length(sunCol);
    }
  }
  if(nofog<0.5){
    float dist=length(cam-vw);
    float f=clamp((dist-fogN)/(fogF-fogN),0.0,1.0);
    col=mix(col,fogCol,f);
  }
  gl_FragColor=vec4(col,alpha);
}\`;
function sh(type, src) { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; }
const prog = gl.createProgram();
gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(prog);
if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
gl.useProgram(prog);
const A = { p: gl.getAttribLocation(prog, 'p'), n: gl.getAttribLocation(prog, 'n'), c: gl.getAttribLocation(prog, 'c') };
const U = {}; ['vp', 'm', 'wave', 't', 'ps', 'sunDir', 'sunCol', 'amb', 'fogCol', 'cam', 'tint', 'fogN', 'fogF', 'unlit', 'nofog', 'alpha'].forEach(k => U[k] = gl.getUniformLocation(prog, k));
gl.enableVertexAttribArray(A.p); gl.enableVertexAttribArray(A.n); gl.enableVertexAttribArray(A.c);
gl.enable(gl.DEPTH_TEST);
gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

// ---------- constructeur de formes ----------
class B {
  constructor() { this.p = []; this.n = []; this.c = []; }
  v(x, y, z, nx, ny, nz, col) { this.p.push(x, y, z); this.n.push(nx, ny, nz); this.c.push(col[0], col[1], col[2]); }
  tri(a, b, c, col, up) {
    let ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
    if (up && ny < 0) { nx = -nx; ny = -ny; nz = -nz; }
    const cs = Array.isArray(col[0]) ? col : [col, col, col];
    this.v(a[0], a[1], a[2], nx, ny, nz, cs[0]); this.v(b[0], b[1], b[2], nx, ny, nz, cs[1]); this.v(c[0], c[1], c[2], nx, ny, nz, cs[2]);
  }
  // boîte : centre, taille, couleur, rotation Y
  box(cx, cy, cz, sx, sy, sz, col, ry, shade) {
    ry = ry || 0; const co = Math.cos(ry), si = Math.sin(ry);
    const R = (x, z) => [cx + x * co + z * si, cz - x * si + z * co];
    const hx = sx / 2, hy = sy / 2, hz = sz / 2;
    const F = [
      [[1, 0, 0], [[hx, -hy, -hz], [hx, hy, -hz], [hx, hy, hz], [hx, -hy, hz]]],
      [[-1, 0, 0], [[-hx, -hy, hz], [-hx, hy, hz], [-hx, hy, -hz], [-hx, -hy, -hz]]],
      [[0, 1, 0], [[-hx, hy, -hz], [-hx, hy, hz], [hx, hy, hz], [hx, hy, -hz]]],
      [[0, -1, 0], [[-hx, -hy, hz], [-hx, -hy, -hz], [hx, -hy, -hz], [hx, -hy, hz]]],
      [[0, 0, 1], [[hx, -hy, hz], [hx, hy, hz], [-hx, hy, hz], [-hx, -hy, hz]]],
      [[0, 0, -1], [[-hx, -hy, -hz], [-hx, hy, -hz], [hx, hy, -hz], [hx, -hy, -hz]]]
    ];
    for (const [nn, vs] of F) {
      const nr = R(nn[0], nn[2]); const nx = nr[0] - cx, nz = nr[1] - cz;
      const pts = vs.map(q => { const r = R(q[0], q[2]); return [r[0], cy + q[1], r[1]]; });
      const cc = shade ? col.map(v => v * (nn[1] > 0 ? 1.06 : nn[1] < 0 ? 0.8 : 0.95)) : col;
      for (const i of [0, 1, 2, 0, 2, 3]) this.v(pts[i][0], pts[i][1], pts[i][2], nx, nn[1], nz, cc);
    }
  }
  // cylindre vertical (r2=0 => cône)
  cyl(cx, cy, cz, r1, r2, h, seg, col, rot) {
    rot = rot || 0;
    for (let i = 0; i < seg; i++) {
      const a0 = rot + i / seg * Math.PI * 2, a1 = rot + (i + 1) / seg * Math.PI * 2, am = (a0 + a1) / 2;
      const p00 = [cx + Math.cos(a0) * r1, cy, cz + Math.sin(a0) * r1], p01 = [cx + Math.cos(a1) * r1, cy, cz + Math.sin(a1) * r1];
      const p10 = [cx + Math.cos(a0) * r2, cy + h, cz + Math.sin(a0) * r2], p11 = [cx + Math.cos(a1) * r2, cy + h, cz + Math.sin(a1) * r2];
      const sl = (r1 - r2) / h; const nx = Math.cos(am), nz = Math.sin(am), ny = sl; const l = Math.hypot(nx, ny, nz);
      for (const q of [p00, p10, p11, p00, p11, p01]) this.v(q[0], q[1], q[2], nx / l, ny / l, nz / l, col);
      if (r2 > 0) { for (const q of [[cx, cy + h, cz], p11, p10]) this.v(q[0], q[1], q[2], 0, 1, 0, col); }
      for (const q of [[cx, cy, cz], p00, p01]) this.v(q[0], q[1], q[2], 0, -1, 0, col);
    }
  }
  // sphère basse résolution (étirable)
  sph(cx, cy, cz, rx, ry, rz, col, seg, jit) {
    seg = seg || 8; const rs = seg, cs = seg * 2; const rr = jit ? mulberry(Math.floor(cx * 13 + cz * 7 + cy * 3)) : null;
    const P = (i, j) => { const th = i / rs * Math.PI, ph = j / cs * Math.PI * 2; const k = jit && i > 0 && i < rs ? 1 + (rr() - 0.5) * jit : 1; return [Math.sin(th) * Math.cos(ph) * k, Math.cos(th) * k, Math.sin(th) * Math.sin(ph) * k]; };
    const G = []; for (let i = 0; i <= rs; i++) { G.push([]); for (let j = 0; j <= cs; j++) G[i].push(j === cs ? G[i][0] : P(i, j)); }
    const W = q => [cx + q[0] * rx, cy + q[1] * ry, cz + q[2] * rz];
    for (let i = 0; i < rs; i++) for (let j = 0; j < cs; j++) {
      const a = G[i][j], b = G[i + 1][j], c = G[i + 1][j + 1], d = G[i][j + 1];
      const tri = (x, y, z) => { const nx = (x[0] + y[0] + z[0]) / 3 / rx, ny = (x[1] + y[1] + z[1]) / 3 / ry, nz = (x[2] + y[2] + z[2]) / 3 / rz; const l = Math.hypot(nx, ny, nz) || 1; for (const q of [x, y, z]) { const w = W(q); this.v(w[0], w[1], w[2], nx / l, ny / l, nz / l, col); } };
      if (i > 0) tri(a, b, d); if (i < rs - 1) tri(d, b, c);
    }
  }
  mesh(mode) { return mkMesh(this, mode); }
}
function mkMesh(b, mode) {
  const mk = arr => { const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(arr), gl.STATIC_DRAW); return buf; };
  return { pb: mk(b.p), nb: mk(b.n), cb: mk(b.c), count: b.p.length / 3, mode: mode === undefined ? gl.TRIANGLES : mode };
}
function dynMesh() { return { pb: gl.createBuffer(), nb: gl.createBuffer(), cb: gl.createBuffer(), count: 0, mode: gl.LINES }; }
function majDyn(m, p, c, mode) {
  m.mode = mode; m.count = p.length / 3; if (!m.count) return;
  gl.bindBuffer(gl.ARRAY_BUFFER, m.pb); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(p), gl.DYNAMIC_DRAW);
  gl.bindBuffer(gl.ARRAY_BUFFER, m.nb); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(p.length), gl.DYNAMIC_DRAW);
  gl.bindBuffer(gl.ARRAY_BUFFER, m.cb); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(c), gl.DYNAMIC_DRAW);
}
const ONE = [1, 1, 1];
function draw(me, m, o) {
  if (!me.count) return; o = o || {};
  gl.uniformMatrix4fv(U.m, false, m || IDM);
  gl.uniform3fv(U.tint, o.tint || ONE);
  gl.uniform1f(U.unlit, o.unlit ? 1 : 0); gl.uniform1f(U.nofog, o.nofog ? 1 : 0);
  gl.uniform1f(U.wave, o.wave ? 1 : 0); gl.uniform1f(U.alpha, o.alpha || 1); gl.uniform1f(U.ps, o.ps || 1);
  gl.bindBuffer(gl.ARRAY_BUFFER, me.pb); gl.vertexAttribPointer(A.p, 3, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, me.nb); gl.vertexAttribPointer(A.n, 3, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, me.cb); gl.vertexAttribPointer(A.c, 3, gl.FLOAT, false, 0, 0);
  gl.drawArrays(me.mode, 0, me.count);
}
const IDM = M4.id();

// =====================================================================
//  L'ÎLE
// =====================================================================
const POND = [-14, 10];
const DOCK = { x0: 25, x1: 50, z0: -1.6, z1: 1.6, y: 1.05, tx0: 44, tz0: -4.5, tz1: 4.5 };
function islandD(x, z) { const a = Math.atan2(z, x); return Math.hypot(x, z) * (1 + 0.10 * Math.sin(a * 3 + 0.5) + 0.06 * Math.cos(a * 5)); }
function startH(x, z) {
  const d = islandD(x, z);
  let h = 0.2 * (34 - d);
  const nz = Math.sin(x * 0.13) * 1.3 + Math.cos(z * 0.11) * 1.2 + Math.sin((x + z) * 0.27) * 0.5 + Math.cos((x - z) * 0.21) * 0.4;
  h += nz * clamp((34 - d) / 14, 0, 1);
  if (h > 4) h = 4 + (h - 4) * 0.5;
  if (h < -7) h = -7 + (h + 7) * 0.15;
  const dp = Math.hypot(x - POND[0], z - POND[1]);
  if (dp < 11) { const s = clamp((11 - dp) / 6, 0, 1); const k = s * s * (3 - 2 * s); h = lerp(h, -1.8, k); }
  // zone du village un peu plus plate
  const dv = Math.hypot(x - 14, z);
  if (dv < 16) { const k = clamp((16 - dv) / 8, 0, 1) * 0.6; h = lerp(h, 1.6, k); }
  return h;
}
// ---- les autres îles ----
const ILES = [
  { id: 'braise', nom: '🌋 Île Braise', x: 235, z: -150, R: 30, style: 'volcan', seed: 1.3 },
  { id: 'givre', nom: '❄️ Île Givre', x: -235, z: -165, R: 30, style: 'glace', seed: 2.1 },
  { id: 'marais', nom: '🌫️ Marais Brumeux', x: -175, z: 235, R: 32, style: 'marais', seed: 3.7 },
  { id: 'recif', nom: '🐠 Récif Perdu', x: 215, z: 215, R: 26, style: 'recif', seed: 4.4 }
];
for (const I of ILES) {
  const l = Math.hypot(I.x, I.z); I.dx = -I.x / l; I.dz = -I.z / l; // direction vers l'île de départ
  I.px = I.dz; I.pz = -I.dx; // perpendiculaire
  I.ry = Math.atan2(I.dx, I.dz);
  I.vx = I.x + I.dx * (I.R - 11); I.vz = I.z + I.dz * (I.R - 11); // place du village
  I.u0 = I.R - 7; I.u1 = I.R + 15; // ponton
}
function noiseH(x, z) { return Math.sin(x * 0.13) * 1.3 + Math.cos(z * 0.11) * 1.2 + Math.sin((x + z) * 0.27) * 0.5 + Math.cos((x - z) * 0.21) * 0.4; }
function isleH(I, x, z) {
  const dx = x - I.x, dz = z - I.z, a = Math.atan2(dz, dx);
  const d = Math.hypot(dx, dz) * (1 + 0.10 * Math.sin(a * 3 + I.seed) + 0.06 * Math.cos(a * 5 + I.seed * 2));
  let h = 0.2 * (I.R - d) + noiseH(x + I.seed * 50, z) * clamp((I.R - d) / 14, 0, 1);
  if (I.style === 'volcan') { const c = Math.max(0, I.R * 0.62 - d); h += c * 0.95; if (d < 3.5) h -= (3.5 - d) * 2.2; }
  if (I.style === 'marais') { h = h * 0.4 + 0.15; if (h > 0) h -= Math.max(0, Math.sin(x * 0.31) * Math.cos(z * 0.29)) * 1.1; }
  if (I.style === 'recif') h *= 0.65;
  if (I.style !== 'volcan' && h > 4) h = 4 + (h - 4) * 0.5;
  const dv = Math.hypot(x - I.vx, z - I.vz);
  if (dv < 13) { const k = clamp((13 - dv) / 6, 0, 1) * 0.85; h = lerp(h, 1.5, k); }
  return Math.max(h, -8);
}
function H(x, z) {
  if (x * x + z * z < 120 * 120) return startH(x, z);
  let best = -8;
  for (const I of ILES) { const dx = x - I.x, dz = z - I.z; if (dx * dx + dz * dz < (I.R + 45) * (I.R + 45)) best = Math.max(best, isleH(I, x, z)); }
  return best;
}
function onIsleDock(I, x, z) {
  const dx = x - I.x, dz = z - I.z; const u = dx * I.dx + dz * I.dz, v = dx * I.px + dz * I.pz;
  return (u >= I.u0 && u <= I.u1 && Math.abs(v) <= 1.6) || (u >= I.u1 - 6 && u <= I.u1 && Math.abs(v) <= 4.5);
}
function onDock(x, z) {
  if ((x >= DOCK.x0 && x <= DOCK.x1 && z >= DOCK.z0 && z <= DOCK.z1) || (x >= DOCK.tx0 && x <= DOCK.x1 && z >= DOCK.tz0 && z <= DOCK.tz1)) return true;
  for (const I of ILES) if (Math.abs(x - I.x) < I.R + 20 && Math.abs(z - I.z) < I.R + 20 && onIsleDock(I, x, z)) return true;
  return false;
}
function groundY(x, z) { const h = H(x, z); return onDock(x, z) ? Math.max(h, DOCK.y) : h; }
function ileProche(x, z) { for (const I of ILES) if (Math.hypot(x - I.x, z - I.z) < I.R + 45) return I; return null; }
function waveY(x, z, t) { return Math.sin(x * 0.35 + t * 1.3) * 0.13 + Math.cos(z * 0.3 + t * 1.1) * 0.13 + Math.sin((x + z) * 0.6 + t * 2.0) * 0.04; }
const PATHS = [[[26, 0], [6, 0]], [[6, 0], [-2, -4]], [[6, 0], [8, -13]], [[6, 0], [-6, 8]], [[18, 0], [18, -4]], [[18, 0], [18, 5]]];
function distSeg(px, pz, a, b) { const dx = b[0] - a[0], dz = b[1] - a[1]; const t = clamp(((px - a[0]) * dx + (pz - a[1]) * dz) / (dx * dx + dz * dz), 0, 1); return Math.hypot(px - a[0] - dx * t, pz - a[1] - dz * t); }
function onPath(x, z) { let m = 99; for (const s of PATHS) m = Math.min(m, distSeg(x, z, s[0], s[1])); return m; }
function zoneAt(x, z) {
  const I = ileProche(x, z); if (I) return I.id;
  if (Math.hypot(x - POND[0], z - POND[1]) < 9.5) return 'etang';
  return Math.hypot(x, z) > 52 ? 'large' : 'cote';
}
const NOM_ZONE = { etang: '🌿 Étang', cote: '🏖️ Côte', large: '🌊 Large', braise: '🌋 Île Braise', givre: '❄️ Île Givre', marais: '🌫️ Marais Brumeux', recif: '🐠 Récif Perdu' };
const COLLIDERS = [];

const C = {
  sable: hex('#e9d49b'), sableH: hex('#d8c085'), herbe: hex('#63b347'), herbe2: hex('#4f9a3b'), herbe3: hex('#7cc456'), roche: hex('#8b8f93'),
  fond: hex('#c9b27a'), fondP: hex('#2a6f80'), chemin: hex('#c8a46a'), bois: hex('#9a6a3e'), boisF: hex('#6e4826'), boisC: hex('#b9875a'),
  toitR: hex('#c8443a'), toitB: hex('#3a78c8'), blanc: hex('#f2f2ee'), rouge: hex('#d8423a'), feuille: hex('#3f9b3a'), feuille2: hex('#2f7f30'),
  tronc: hex('#8a6038'), pierre: hex('#9aa0a6'), pierreF: hex('#6c7176'), jaune: hex('#ffd84a'), lampe: hex('#ffe9a0')
};
function buildWorld() {
  const b = new B(), glow = new B();
  const rand = mulberry(42);
  function lampadaire(x, y, z) {
    const fer = hex('#3b3f45');
    b.cyl(x, y, z, 0.1, 0.07, 2.75, 6, fer); b.box(x, y + 2.72, z, 0.46, 0.06, 0.46, fer);
    glow.box(x, y + 2.98, z, 0.36, 0.46, 0.36, C.lampe);
    b.box(x, y + 3.24, z, 0.56, 0.08, 0.56, fer); b.cyl(x, y + 3.28, z, 0.3, 0, 0.25, 4, fer, Math.PI / 4);
  }
  // ---- terrain ----
  const N = 110, S = 1.7, O = -N * S / 2;
  const col = (x, z, h) => {
    let c;
    if (h < -3) c = mixc(C.fond, hex('#16507a'), clamp((-h - 3) / 3.5, 0, 1));
    else if (h < 0.15) c = mixc(C.sableH, C.fond, clamp(-h / 3, 0, 1));
    else if (h < 0.75) c = C.sable;
    else {
      const n = Math.sin(x * 0.7) * Math.cos(z * 0.6) + Math.sin(x * 0.23 + z * 0.31);
      c = n > 0.8 ? C.herbe3 : n < -0.7 ? C.herbe2 : C.herbe;
      if (h > 4.3) c = mixc(c, C.roche, clamp((h - 4.3) / 1.5, 0, 0.6));
      const dpth = onPath(x, z); if (dpth < 1.7) c = mixc(C.chemin, c, clamp((dpth - 1.0) / 0.7, 0, 1));
    }
    const j = 0.96 + rand() * 0.08; return [c[0] * j, c[1] * j, c[2] * j];
  };
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
    const x0 = O + i * S, z0 = O + j * S, x1 = x0 + S, z1 = z0 + S;
    const a = [x0, H(x0, z0), z0], bb = [x1, H(x1, z0), z0], c = [x1, H(x1, z1), z1], d = [x0, H(x0, z1), z1];
    const mx = (x0 + x1) / 2, mz = (z0 + z1) / 2;
    const cc = col(mx, mz, (a[1] + bb[1] + c[1] + d[1]) / 4);
    b.tri(a, bb, c, cc, true); b.tri(a, c, d, col(mx + 0.3, mz + 0.3, (a[1] + c[1] + d[1]) / 3), true);
  }
  // ---- ponton ----
  const dy = DOCK.y;
  for (let x = DOCK.x0; x < DOCK.x1; x += 1.0) b.box(x + 0.5, dy - 0.1, 0, 0.92, 0.2, 3.2, (Math.floor(x) % 2 ? C.boisC : C.bois), 0, true);
  for (let z = DOCK.tz0; z < DOCK.tz1; z += 1.0) b.box((DOCK.tx0 + DOCK.x1) / 2, dy - 0.08, z + 0.5, DOCK.x1 - DOCK.tx0, 0.2, 0.92, (Math.floor(z) % 2 ? C.boisC : C.bois), 0, true);
  for (let x = DOCK.x0 + 2; x <= DOCK.x1; x += 4) for (const z of [-1.6, 1.6]) b.cyl(x, -4, z, 0.18, 0.18, dy + 4.6, 6, C.boisF);
  for (const [x, z] of [[DOCK.tx0, -4.5], [DOCK.tx0, 4.5], [DOCK.x1, -4.5], [DOCK.x1, 4.5]]) b.cyl(x, -4, z, 0.2, 0.2, dy + 4.9, 6, C.boisF);
  // corde/rambarde
  b.box((DOCK.tx0 + DOCK.x1) / 2, dy + 0.7, -4.5, DOCK.x1 - DOCK.tx0, 0.1, 0.1, C.boisF); b.box((DOCK.tx0 + DOCK.x1) / 2, dy + 0.7, 4.5, DOCK.x1 - DOCK.tx0, 0.1, 0.1, C.boisF);
  // caisses et filets sur le ponton
  b.box(46, dy + 0.4, 3.5, 0.8, 0.8, 0.8, C.boisC, 0.3, true); b.box(46.9, dy + 0.35, 3.6, 0.7, 0.7, 0.7, C.bois, -0.2, true); b.box(46.4, dy + 1.05, 3.5, 0.6, 0.5, 0.6, C.boisC, 0.6, true);
  b.cyl(48.5, dy, -3.6, 0.35, 0.35, 0.9, 8, hex('#5a7a8a'));
  // lampadaires du ponton
  for (const [x, z] of [[DOCK.x0 + 1, 2.0], [DOCK.tx0, -4.0], [DOCK.x1 - 0.5, 4.0]]) lampadaire(x, dy, z);

  // ---- boutique de cannes (toit rouge) ----
  const shop = (cx, cz, w, d, ry, toit, mur) => {
    const y = Math.min(H(cx - w / 2, cz - d / 2), H(cx + w / 2, cz + d / 2), H(cx, cz)) - 0.5;
    const yt = Math.max(H(cx, cz), y + 0.5) + 3.2;
    b.box(cx, (y + yt) / 2, cz, w, yt - y, d, mur, ry, true);
    // toit en pente (pyramide 4 côtés)
    const co = Math.cos(ry), si = Math.sin(ry); const R = (x, z) => [cx + x * co + z * si, cz - x * si + z * co];
    const hw = w / 2 + 0.6, hd = d / 2 + 0.6; const top = [cx, yt + 2.2, cz];
    const cs = [[-hw, -hd], [hw, -hd], [hw, hd], [-hw, hd]].map(q => { const r = R(q[0], q[1]); return [r[0], yt, r[1]]; });
    for (let i = 0; i < 4; i++) b.tri(cs[i], cs[(i + 1) % 4], top, toit, true);
    for (let i = 0; i < 4; i++) b.tri(cs[(i + 1) % 4], cs[i], [cx, yt, cz], toit.map(v => v * 0.6));
    // porte + fenêtres (face +z locale)
    const fp = R(0, d / 2 + 0.03); b.box(fp[0], H(cx, cz) + 1.0, fp[1], 1.2, 2.0, 0.08, C.boisF, ry);
    for (const wx of [-w / 2 + 1.1, w / 2 - 1.1]) { const fw = R(wx, d / 2 + 0.03); glow.box(fw[0], H(cx, cz) + 1.6, fw[1], 0.9, 0.8, 0.07, C.lampe, ry); }
    COLLIDERS.push({ x: cx, z: cz, r: Math.max(w, d) / 2 + 0.3 });
    return H(cx, cz);
  };
  const ys = shop(18, -9, 7, 5, 0, C.toitR, hex('#e8dcc4'));
  // enseigne canne
  b.box(18, ys + 3.6, -6.4, 2.6, 0.7, 0.12, C.boisF); b.box(18, ys + 3.6, -6.32, 2.2, 0.08, 0.05, C.jaune);
  // maisons
  shop(-2, -10, 5, 4, 0.4, C.toitB, hex('#f0e6d6'));
  shop(-3, 17, 5, 4.5, 2.6, hex('#5a9a4a'), hex('#e6d8bf'));
  shop(6, 15, 4.5, 4, 3.4, C.toitR, hex('#d9e4ec'));

  // ---- étal du marchand ----
  {
    const cx = 18, cz = 7.5, y = H(cx, cz);
    b.box(cx, y + 0.5, cz - 1.2, 4.2, 1.0, 1.0, C.bois, 0, true); // comptoir
    b.box(cx, y + 1.02, cz - 1.2, 4.4, 0.08, 1.1, C.boisC);
    for (const [x, z] of [[-2, -1.7], [2, -1.7], [-2, 1.2], [2, 1.2]]) b.cyl(cx + x, y - 0.5, cz + z, 0.1, 0.1, 3.6, 6, C.boisF);
    for (let i = 0; i < 8; i++) b.box(cx - 2.2 + i * 0.55 + 0.27, y + 3.1, cz - 0.25, 0.55, 0.12, 3.4, i % 2 ? C.blanc : hex('#2b9be0'));
    // poissons exposés
    for (let i = 0; i < 5; i++) b.sph(cx - 1.5 + i * 0.75, y + 1.15, cz - 1.25, 0.28, 0.1, 0.13, hex(['#5a8ad0', '#c0c8d0', '#e05030', '#d8b040', '#3a7a8a'][i]), 4);
    b.box(cx + 2.8, y + 0.35, cz - 1.0, 0.8, 0.7, 0.8, C.boisC, 0.4, true); b.box(cx - 2.8, y + 0.35, cz - 0.6, 0.8, 0.7, 0.8, C.bois, -0.3, true);
    COLLIDERS.push({ x: cx, z: cz - 0.3, r: 2.3 });
  }
  // ---- stand d'appâts (tonneaux) ----
  {
    const cx = 25.5, cz = -4.2, y = H(cx, cz);
    for (const [x, z, c] of [[-0.8, 0, '#7a5230'], [0.3, 0.2, '#8a6238'], [1.3, -0.3, '#7a5230']]) { b.cyl(cx + x, y - 0.3, cz + z, 0.45, 0.45, 1.3, 9, hex(c)); b.cyl(cx + x, y + 0.6, cz + z, 0.47, 0.47, 0.08, 9, hex('#444')); }
    b.box(cx, y + 2.6, cz, 3.4, 0.15, 2.2, hex('#3fbf55'), 0); for (const [x, z] of [[-1.5, -1], [1.5, -1], [-1.5, 1], [1.5, 1]]) b.cyl(cx + x, y - 0.3, cz + z, 0.07, 0.07, 2.9, 5, C.boisF);
    COLLIDERS.push({ x: cx, z: cz, r: 1.6 });
  }
  // ---- sanctuaire des totems ----
  {
    const cx = 7, cz = -18, y = H(cx, cz);
    b.cyl(cx, y - 1, cz, 4.2, 4.0, 1.25, 10, C.pierre); b.cyl(cx, y + 0.25, cz, 3.2, 3.0, 0.25, 10, C.pierreF);
    const tc = [['#ffb020', '#ffe066'], ['#5a6cff', '#c0c8ff'], ['#3a8ad0', '#9fd6ff'], ['#9aa0a6', '#e0e6ea']];
    tc.forEach((t, i) => {
      const a = -Math.PI / 2 + (i - 1.5) * 0.65, x = cx + Math.cos(a) * 2.2, z = cz + Math.sin(a) * 2.2;
      for (let k = 0; k < 3; k++) { b.box(x, y + 0.9 + k * 0.75, z, 0.75, 0.72, 0.75, hex(k % 2 ? t[1] : t[0]), a, true); }
      glow.box(x + Math.cos(a + Math.PI / 2) * 0, y + 1.65, z, 0.78, 0.12, 0.2, hex(t[1]), a);
    });
    COLLIDERS.push({ x: cx, z: cz - 1, r: 3.3 });
  }
  // ---- phare ----
  {
    const cx = -11, cz = -26, y = H(cx, cz) - 0.5;
    for (let k = 0; k < 6; k++) b.cyl(cx, y + k * 1.6, cz, 1.6 - k * 0.12, 1.6 - (k + 1) * 0.12, 1.6, 12, k % 2 ? C.blanc : C.rouge);
    b.cyl(cx, y + 9.6, cz, 1.3, 1.3, 0.2, 12, hex('#333')); glow.cyl(cx, y + 9.8, cz, 0.8, 0.8, 1.2, 8, C.lampe); b.cyl(cx, y + 11, cz, 1.1, 0, 1.0, 12, C.rouge);
    COLLIDERS.push({ x: cx, z: cz, r: 1.8 });
  }
  // ---- arbres ----
  const arbres = [];
  for (let k = 0; k < 600 && arbres.length < 85; k++) {
    const x = (rand() - 0.5) * 72, z = (rand() - 0.5) * 72, h = H(x, z);
    if (h < 0.55 || onPath(x, z) < 4.2 || (x > 19 && Math.abs(z) < 9) || Math.hypot(x - POND[0], z - POND[1]) < 10) continue;
    if (COLLIDERS.some(c => Math.hypot(x - c.x, z - c.z) < c.r + 2.2)) continue;
    if (arbres.some(a => Math.hypot(x - a[0], z - a[1]) < 3.2)) continue;
    if (Math.hypot(x - 14, z) < 9 && Math.abs(z) < 5) continue;
    arbres.push([x, z]);
    if (h < 1.9) { // palmier
      const lean = rand() * Math.PI * 2, hh = 4.5 + rand() * 2; let px = x, pz = z, py = h - 0.2;
      for (let s = 0; s < 6; s++) { const nx = px + Math.cos(lean) * 0.18 * s * 0.4, nz = pz + Math.sin(lean) * 0.18 * s * 0.4; b.cyl(px, py, pz, 0.3 - s * 0.025, 0.28 - s * 0.025, hh / 6 + 0.05, 6, s % 2 ? C.tronc : hex('#9a7048')); px = nx; pz = nz; py += hh / 6; }
      for (let f = 0; f < 7; f++) {
        const a = f / 7 * Math.PI * 2 + rand(), L = 2.6; const ex = px + Math.cos(a) * L, ez = pz + Math.sin(a) * L;
        const pr = [-Math.sin(a) * 0.55, Math.cos(a) * 0.55];
        b.tri([px, py, pz], [ex + pr[0], py - 0.9, ez + pr[1]], [ex - pr[0], py - 0.9, ez - pr[1]], f % 2 ? C.feuille : C.feuille2, true);
        b.tri([px, py, pz], [px + Math.cos(a) * 1.2, py + 0.35, pz + Math.sin(a) * 1.2], [ex, py - 0.9, ez], C.feuille, true);
      }
      b.sph(px, py - 0.2, pz, 0.25, 0.25, 0.25, hex('#6b4a2a'), 4);
      COLLIDERS.push({ x, z, r: 0.5 });
    } else { // arbre rond
      const hh = 1.8 + rand() * 1.2, r = 1.5 + rand() * 0.8;
      b.cyl(x, h - 0.3, z, 0.32, 0.25, hh + 0.5, 6, C.tronc);
      const g = rand() > 0.5 ? C.feuille : C.feuille2;
      b.sph(x, h + hh + r * 0.7, z, r, r * 0.9, r, g, 6, 0.25);
      b.sph(x + r * 0.5, h + hh + r * 0.3, z - r * 0.3, r * 0.6, r * 0.55, r * 0.6, mixc(g, C.herbe3, 0.3), 5, 0.2);
      COLLIDERS.push({ x, z, r: 0.6 });
    }
  }
  // ---- rochers ----
  for (let k = 0; k < 40; k++) {
    const a = rand() * Math.PI * 2, d = 26 + rand() * 18, x = Math.cos(a) * d, z = Math.sin(a) * d;
    if (Math.abs(z) < 8 && x > 20) continue;
    const h = H(x, z), s = 0.5 + rand() * 1.4; b.sph(x, h + s * 0.2, z, s * 1.2, s * 0.8, s, mixc(C.pierre, C.pierreF, rand()), 5, 0.35);
    if (h > -0.3) COLLIDERS.push({ x, z, r: s * 0.9 });
  }
  // ---- fleurs & herbes ----
  for (let k = 0; k < 260; k++) {
    const x = (rand() - 0.5) * 66, z = (rand() - 0.5) * 66, h = H(x, z);
    if (h < 0.9 || onPath(x, z) < 1.8) continue;
    if (rand() < 0.5) b.box(x, h + 0.12, z, 0.16, 0.16, 0.16, hex(['#ff5a7a', '#ffe066', '#ffffff', '#b45cff', '#ff8a20'][Math.floor(rand() * 5)]));
    else { b.tri([x - 0.2, h, z], [x + 0.2, h, z], [x, h + 0.5, z + 0.05], C.herbe2); b.tri([x, h, z - 0.2], [x, h, z + 0.2], [x + 0.05, h + 0.45, z], C.herbe3); }
  }
  // ---- lampadaires du village ----
  for (const [x, z] of [[10, 1.8], [2, -1.8], [6, -8], [-2, 4.5], [20, 2.2]]) { lampadaire(x, H(x, z) - 0.2, z); COLLIDERS.push({ x, z, r: 0.3 }); }
  // ---- nénuphars sur l'étang ----
  for (let k = 0; k < 14; k++) { const a = rand() * 6.28, d = 2 + rand() * 5; const x = POND[0] + Math.cos(a) * d, z = POND[1] + Math.sin(a) * d; if (H(x, z) < -0.3) { b.cyl(x, 0.05, z, 0.55, 0.55, 0.04, 7, hex('#3f9b3a'), a); if (rand() < 0.4) b.sph(x, 0.15, z, 0.15, 0.12, 0.15, hex('#ffb0d0'), 4); } }

  // ---- eau ----
  // ---- les autres îles ----
  for (const I of ILES) buildIsle(I, b, glow, mulberry(Math.floor(I.seed * 1000)), lampadaire, shop);
  const w = new B(); const WN = 130, WS = 4, WO = -WN * WS / 2; const wc = hex('#1f86c4');
  for (let i = 0; i < WN; i++) for (let j = 0; j < WN; j++) {
    const x0 = WO + i * WS, z0 = WO + j * WS; const a = [x0, 0, z0], bb = [x0 + WS, 0, z0], c = [x0 + WS, 0, z0 + WS], d = [x0, 0, z0 + WS];
    w.tri(a, c, bb, wc, true); w.tri(a, d, c, wc, true);
  }
  // ---- étoiles ----
  const st = new B();
  for (let k = 0; k < 420; k++) { const u = rand() * 2 - 1, th = rand() * Math.PI * 2; const y = Math.abs(u); const r = Math.sqrt(1 - y * y); const g = 0.7 + rand() * 0.3; st.v(r * Math.cos(th) * 600, y * 600 + 10, r * Math.sin(th) * 600, 0, 1, 0, [g, g, g * 1.05]); }
  // ---- soleil / lune ----
  const sun = new B(); sun.sph(0, 0, 0, 1, 1, 1, [1, 0.95, 0.75], 8);
  const moon = new B(); moon.sph(0, 0, 0, 1, 1, 1, [0.9, 0.93, 1], 8);
  // ---- nuages ----
  const cl = new B(); const cr = mulberry(7);
  for (let k = 0; k < 70; k++) { const a = cr() * 6.28, d = 60 + cr() * 330, x = Math.cos(a) * d, z = Math.sin(a) * d, y = 38 + cr() * 14; for (let q = 0; q < 4; q++) cl.sph(x + (cr() - 0.5) * 12, y + cr() * 2, z + (cr() - 0.5) * 7, 5 + cr() * 4, 2.2 + cr() * 1.5, 4 + cr() * 3, [1, 1, 1], 5, 0.2); }
  const fo = new B(); const fc = hex('#16507a'); fo.tri([-600, -9, -600], [600, -9, 600], [600, -9, -600], fc, true); fo.tri([-600, -9, -600], [-600, -9, 600], [600, -9, 600], fc, true);
  return { fond: fo.mesh(), terre: b.mesh(), glow: glow.mesh(), eau: w.mesh(), etoiles: st.mesh(gl.POINTS), soleil: sun.mesh(), lune: moon.mesh(), nuages: cl.mesh() };
}

// ---------- construction d'une île ----------
function buildIsle(I, b, glow, rand, lampadaire, shop) {
  const st = I.style;
  const pal = {
    volcan: { sable: hex('#4a4440'), herbe: hex('#5a524c'), herbe2: hex('#3e3834'), haut: hex('#2e2a28'), fond: hex('#3a3634') },
    glace: { sable: hex('#cfd8e0'), herbe: hex('#f2f6fa'), herbe2: hex('#dfe8f0'), haut: hex('#ffffff'), fond: hex('#8aa0b0') },
    marais: { sable: hex('#6a6040'), herbe: hex('#4a6a32'), herbe2: hex('#3a5428'), haut: hex('#56763a'), fond: hex('#3a4a30') },
    recif: { sable: hex('#f6ecd0'), herbe: hex('#7cc456'), herbe2: hex('#63b347'), haut: hex('#8ad060'), fond: hex('#e0d0a0') }
  }[st];
  // terrain
  const S = 1.7, N = Math.ceil((I.R + 22) * 2 / S), O = -N * S / 2;
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
    const x0 = I.x + O + i * S, z0 = I.z + O + j * S, x1 = x0 + S, z1 = z0 + S;
    const a = [x0, H(x0, z0), z0], bb = [x1, H(x1, z0), z0], c = [x1, H(x1, z1), z1], d = [x0, H(x0, z1), z1];
    const hm = (a[1] + bb[1] + c[1] + d[1]) / 4; if (hm < -7.9) continue;
    let col = hm < -2 ? mixc(pal.fond, hex('#16507a'), clamp((-hm - 2) / 4, 0, 1)) : hm < 0.15 ? mixc(pal.sable, pal.fond, clamp(-hm / 4, 0, 1)) : hm < 0.7 ? pal.sable : ((Math.sin(x0 * 0.7) * Math.cos(z0 * 0.6) > 0.3) ? pal.herbe2 : pal.herbe);
    if (hm > 5) col = mixc(col, pal.haut, clamp((hm - 5) / 5, 0, 1));
    if (st === 'volcan' && hm > 12) col = mixc(col, hex('#8a2a10'), clamp((hm - 12) / 4, 0, 0.7));
    const j2 = 0.96 + rand() * 0.08; col = col.map(v => v * j2);
    b.tri(a, bb, c, col, true); b.tri(a, c, d, col.map(v => v * 0.98), true);
  }
  // ponton
  const P = (u, v) => [I.x + I.dx * u + I.px * v, I.z + I.dz * u + I.pz * v];
  const dy = DOCK.y;
  for (let u = I.u0; u < I.u1; u += 1) { const q = P(u + 0.5, 0); b.box(q[0], dy - 0.1, q[1], 3.2, 0.2, 0.92, (Math.floor(u) % 2 ? C.boisC : C.bois), I.ry, true); }
  for (let v = -4.5; v < 4.5; v += 1) { const q = P(I.u1 - 3, v + 0.5); b.box(q[0], dy - 0.08, q[1], 0.92, 0.2, 6, (Math.floor(v) % 2 ? C.boisC : C.bois), I.ry, true); }
  for (let u = I.u0 + 2; u <= I.u1; u += 4) for (const v of [-1.6, 1.6]) { const q = P(u, v); b.cyl(q[0], -4, q[1], 0.18, 0.18, dy + 4.6, 6, C.boisF); }
  for (const v of [-4.5, 4.5]) for (const u of [I.u1 - 6, I.u1]) { const q = P(u, v); b.cyl(q[0], -4, q[1], 0.2, 0.2, dy + 4.9, 6, C.boisF); }
  { const q = P(I.u1 - 6, 3.6); lampadaire(q[0], dy, q[1]); const q2 = P(I.u1, -3.6); lampadaire(q2[0], dy, q2[1]); }
  // cabanes
  const h1 = P(I.R - 18, -7), h2 = P(I.R - 18, 7);
  const toit = { volcan: hex('#3a3a3a'), glace: hex('#4a7ab0'), marais: hex('#5a4a2a'), recif: hex('#e09a3a') }[st];
  const mur = { volcan: hex('#7a6a5a'), glace: hex('#e8eef4'), marais: hex('#8a7a5a'), recif: hex('#f0e2c0') }[st];
  shop(h1[0], h1[1], 5, 4, I.ry, toit, mur); shop(h2[0], h2[1], 5, 4, I.ry, toit, mur);
  for (const v of [-3, 3]) { const q = P(I.R - 8, v); lampadaire(q[0], H(q[0], q[1]) - 0.2, q[1]); COLLIDERS.push({ x: q[0], z: q[1], r: 0.3 }); }
  // déco selon le style
  const libre = (x, z) => Math.hypot(x - I.vx, z - I.vz) > 12 && !onIsleDock(I, x, z) && !COLLIDERS.some(c => Math.hypot(x - c.x, z - c.z) < c.r + 2);
  const nb = st === 'recif' ? 30 : 55;
  for (let k = 0, n = 0; k < 500 && n < nb; k++) {
    const a = rand() * 6.28, d = rand() * I.R, x = I.x + Math.cos(a) * d, z = I.z + Math.sin(a) * d, h = H(x, z);
    if (h < 0.6 || !libre(x, z)) continue;
    if (st === 'volcan' && h > 9) continue;
    n++;
    if (st === 'glace') { // sapin enneigé
      const hh = 1 + rand(); b.cyl(x, h - 0.2, z, 0.25, 0.2, 1.2, 5, C.tronc);
      for (let q = 0; q < 3; q++) { b.cyl(x, h + 0.8 + q * 1.1 * hh * 0.7, z, 1.6 - q * 0.4, 0, 1.6, 7, q % 2 ? hex('#2a6a40') : hex('#2f7a48'), rand()); b.cyl(x, h + 1.9 + q * 1.1 * hh * 0.7, z, 0.5 - q * 0.1, 0, 0.5, 7, hex('#ffffff'), rand()); }
      COLLIDERS.push({ x, z, r: 0.6 });
    } else if (st === 'volcan') { // arbre mort / rocher
      if (rand() < 0.5) { b.cyl(x, h - 0.2, z, 0.2, 0.12, 2.6, 5, hex('#2a2420')); b.box(x + 0.4, h + 1.8, z, 0.9, 0.1, 0.1, hex('#2a2420'), rand() * 6); COLLIDERS.push({ x, z, r: 0.4 }); }
      else { const s2 = 0.6 + rand(); b.sph(x, h + s2 * 0.2, z, s2 * 1.2, s2 * 0.8, s2, hex('#2e2a28'), 5, 0.4); if (rand() < 0.4) glow.sph(x, h + s2 * 0.7, z, s2 * 0.35, 0.1, s2 * 0.35, hex('#ff5a1a'), 4); COLLIDERS.push({ x, z, r: s2 * 0.9 }); }
    } else if (st === 'marais') { // arbre tordu + roseaux + champignons
      if (rand() < 0.45) { b.cyl(x, h - 0.3, z, 0.35, 0.22, 3.2, 6, hex('#4a3a28')); b.sph(x, h + 3.6, z, 1.8, 0.9, 1.8, hex('#3a5a2a'), 5, 0.35); b.box(x, h + 2.6, z + 0.6, 0.12, 1.4, 0.12, hex('#4a6a30')); COLLIDERS.push({ x, z, r: 0.5 }); }
      else { for (let r2 = 0; r2 < 5; r2++) b.box(x + (rand() - 0.5) * 0.8, h + 0.6, z + (rand() - 0.5) * 0.8, 0.07, 1.3, 0.07, hex('#6a7a3a')); if (rand() < 0.5) { glow.cyl(x + 0.6, h, z, 0.05, 0.05, 0.3, 4, hex('#c0ffd0')); glow.sph(x + 0.6, h + 0.35, z, 0.25, 0.12, 0.25, hex('#a0ffb0'), 4); } }
    } else { // récif : palmiers
      const lean = rand() * 6.28, hh = 4.5 + rand() * 2; let px = x, pz = z, py = h - 0.2;
      for (let q = 0; q < 6; q++) { b.cyl(px, py, pz, 0.3 - q * 0.025, 0.28 - q * 0.025, hh / 6 + 0.05, 6, q % 2 ? C.tronc : hex('#9a7048')); px += Math.cos(lean) * 0.07 * q; pz += Math.sin(lean) * 0.07 * q; py += hh / 6; }
      for (let f = 0; f < 7; f++) { const a2 = f / 7 * 6.28 + rand(), ex = px + Math.cos(a2) * 2.6, ez = pz + Math.sin(a2) * 2.6, pr = [-Math.sin(a2) * 0.55, Math.cos(a2) * 0.55]; b.tri([px, py, pz], [ex + pr[0], py - 0.9, ez + pr[1]], [ex - pr[0], py - 0.9, ez - pr[1]], f % 2 ? C.feuille : C.feuille2, true); }
      COLLIDERS.push({ x, z, r: 0.5 });
    }
  }
  // dans l'eau autour
  for (let k = 0; k < 26; k++) {
    const a = rand() * 6.28, d = I.R + 4 + rand() * 22, x = I.x + Math.cos(a) * d, z = I.z + Math.sin(a) * d;
    if (onIsleDock(I, x, z) || Math.hypot(x - (I.x + I.dx * (I.R + 6)), z - (I.z + I.dz * (I.R + 6))) < 12) continue;
    if (st === 'glace') { const s2 = 1.5 + rand() * 3; b.sph(x, 0.2, z, s2, s2 * 0.6, s2 * 0.8, hex('#eef6ff'), 5, 0.3); b.box(x, -1, z, s2 * 1.2, 2, s2 * 1.2, hex('#bfe0f0'), rand() * 3); }
    else if (st === 'recif') { const cc = hex(['#ff6f61', '#ffb0d0', '#b45cff', '#ffd84a', '#30d0a0'][Math.floor(rand() * 5)]); b.cyl(x, -3, z, 0.4, 0.15, 3.2 + rand() * 0.5, 6, cc); b.sph(x, 0.2, z, 0.6, 0.4, 0.6, cc, 4, 0.4); }
    else if (st === 'volcan') { const s2 = 1 + rand() * 2.5; b.sph(x, 0, z, s2 * 1.3, s2, s2, hex('#2a2624'), 5, 0.4); }
    else { b.cyl(x, -2, z, 0.2, 0.15, 3.5, 5, hex('#4a3a28')); if (rand() < 0.5) b.cyl(x + 1, 0.04, z, 0.6, 0.6, 0.04, 7, hex('#3f7b2a'), rand()); }
  }
  if (st === 'volcan') { glow.cyl(I.x, H(I.x, I.z) + 0.3, I.z, 3.4, 3.8, 0.5, 12, hex('#ff5a1a')); }
}

// ---------- personnages ----------
function buildChar() {
  const skin = hex('#f1c39b');
  const leg = new B(); leg.box(0, -0.45, 0, 0.27, 0.9, 0.3, hex('#2f4b7c'), 0, true); leg.box(0, -0.86, 0.04, 0.29, 0.14, 0.36, hex('#3a2a1e'), 0, true);
  const body = new B(); body.box(0, 1.3, 0, 0.72, 0.8, 0.42, [1, 1, 1], 0, true); body.box(0, 0.94, 0, 0.74, 0.1, 0.44, [0.55, 0.55, 0.55]);
  const arm = new B(); arm.box(0, -0.2, 0, 0.23, 0.42, 0.25, [1, 1, 1], 0, true); arm.box(0, -0.55, 0, 0.2, 0.32, 0.22, skin, 0, true);
  const head = new B(); head.box(0, 1.98, 0, 0.52, 0.5, 0.5, skin, 0, true);
  head.box(-0.12, 2.0, 0.255, 0.08, 0.1, 0.02, hex('#1a1a1a')); head.box(0.12, 2.0, 0.255, 0.08, 0.1, 0.02, hex('#1a1a1a'));
  head.box(0, 1.86, 0.255, 0.16, 0.04, 0.02, hex('#9a4a3a'));
  const hat = new B(); hat.box(0, 2.25, 0, 0.84, 0.05, 0.84, [1, 1, 1], 0, true); hat.box(0, 2.38, 0, 0.52, 0.24, 0.52, [1, 1, 1], 0, true); hat.box(0, 2.3, 0, 0.54, 0.07, 0.54, [0.45, 0.45, 0.45]);
  const rod = new B(); rod.box(0, 1.25, 0, 0.05, 2.5, 0.05, [1, 1, 1]); rod.box(0, 0.12, 0, 0.09, 0.32, 0.09, hex('#2a2a2a')); rod.box(0, 0.45, 0.07, 0.1, 0.14, 0.12, hex('#888'));
  const bob = new B(); bob.sph(0, 0.14, 0, 0.25, 0.25, 0.25, hex('#e5484d'), 6); bob.sph(0, -0.08, 0, 0.25, 0.17, 0.25, [1, 1, 1], 6); bob.box(0, 0.45, 0, 0.04, 0.22, 0.04, hex('#222'));
  return { leg: leg.mesh(), body: body.mesh(), arm: arm.mesh(), head: head.mesh(), hat: hat.mesh(), rod: rod.mesh(), bob: bob.mesh() };
}
const fishMeshes = {};
function fishMesh(id) {
  if (fishMeshes[id]) return fishMeshes[id];
  const p = PMAP[id]; const c = hex(p.coul); const b = new B();
  const dark = c.map(v => v * 0.7), light = mixc(c, [1, 1, 1], 0.35);
  if (id === 'crabe') { b.sph(0, 0, 0, 0.4, 0.18, 0.32, c, 6); for (const s of [-1, 1]) { b.sph(s * 0.5, 0.05, 0.25, 0.14, 0.1, 0.12, dark, 4); for (let k = 0; k < 3; k++) b.box(s * 0.42, -0.05, -0.15 + k * 0.15, 0.3, 0.05, 0.05, dark); } }
  else if (id === 'poulpe' || id === 'calmar') { b.sph(0, 0.25, 0, 0.32, 0.42, 0.32, c, 6); for (let k = 0; k < 8; k++) { const a = k / 8 * 6.28; b.box(Math.cos(a) * 0.18, -0.25, Math.sin(a) * 0.18, 0.08, 0.6, 0.08, dark, a); } b.box(-0.12, 0.3, 0.3, 0.07, 0.09, 0.03, [0.05, 0.05, 0.05]); b.box(0.12, 0.3, 0.3, 0.07, 0.09, 0.03, [0.05, 0.05, 0.05]); }
  else if (id === 'raie') { b.sph(0, 0, 0, 0.6, 0.08, 0.5, c, 6); b.box(0, 0, -0.75, 0.05, 0.05, 0.7, dark); }
  else if (id === 'hippocampe') { b.sph(0, 0.2, 0, 0.13, 0.3, 0.13, c, 5); b.sph(0, 0.5, 0.1, 0.11, 0.1, 0.18, c, 5); b.cyl(0, -0.4, -0.05, 0.03, 0.09, 0.5, 5, dark); }
  else {
    const L = id === 'anguille' || id === 'murene' ? 0.9 : id === 'espadon' || id === 'barracuda' ? 0.75 : 0.55;
    const Hh = id === 'lune' ? 0.5 : id === 'requin' || id === 'baleine' ? 0.3 : 0.24;
    b.sph(0, 0, 0, 0.16, Hh, L, c, 7);
    b.sph(0, -Hh * 0.35, 0.05, 0.14, Hh * 0.55, L * 0.75, light, 6);
    b.tri([0, 0, -L * 0.9], [0, Hh * 1.3, -L * 1.35], [0, -Hh * 1.3, -L * 1.35], dark); b.tri([0, 0, -L * 0.9], [0, -Hh * 1.3, -L * 1.35], [0, Hh * 1.3, -L * 1.35], dark);
    b.tri([0, Hh * 0.9, 0.1], [0, Hh * 1.6, -0.15], [0, Hh * 0.9, -0.35], dark); b.tri([0, Hh * 0.9, 0.1], [0, Hh * 0.9, -0.35], [0, Hh * 1.6, -0.15], dark);
    b.box(0.12, Hh * 0.3, L * 0.65, 0.05, 0.08, 0.08, [0.05, 0.05, 0.05]); b.box(-0.12, Hh * 0.3, L * 0.65, 0.05, 0.08, 0.08, [0.05, 0.05, 0.05]);
    if (id === 'espadon') b.box(0, 0.02, L + 0.4, 0.04, 0.04, 0.8, dark);
    if (id === 'requin') b.box(0, 0, L * 0.85, 0.7, 0.12, 0.16, c);
    if (id === 'lanterne') b.sph(0, Hh + 0.3, L * 0.7, 0.08, 0.08, 0.08, [1, 1, 0.6], 4);
    if (id === 'clown') for (const z of [0.25, -0.15]) b.box(0, 0, z, 0.34, Hh * 2.05, 0.08, [1, 1, 1]);
  }
  return fishMeshes[id] = b.mesh();
}

// =====================================================================
//  ÉTAT DU JEU
// =====================================================================
let DATA = null, PMAP = {}, CMAP = {}, AMAP = {}, BMAPC = {}, EMAPC = {}, ME = null, TOKEN = localStorage.getItem('fs_token') || '';
let W = null, CH = null;
const player = { x: 30, y: 1, z: 0, ry: Math.PI / 2, vx: 0, vz: 0, walk: 0, moving: false, armA: -0.4, rodT: 0.5 };
const cam = { yaw: -Math.PI / 2, pitch: 0.38, dist: 9, x: 0, y: 0, z: 0 };
let worldH = 9, worldT0 = performance.now(), meteo = 'soleil', jourMs = 720000, annSince = Date.now();
let autres = {};
const keys = {};
let mouseL = false, holdInput = false, panelOpen = false;
let myBoat = null; // { t, x, z, ry, v, on }
Object.assign(player, { vy: 0, air: false, swim: false, rodOut: true });
const F = { st: 'idle', power: 0, pdir: 1, t: 0, bob: [0, 0, 0], from: null, to: null, wait: 0, shakeT: 0, bite: null, reel: null, catchShow: null };

// ---------- réseau ----------
async function api(url, body) {
  try {
    const r = await fetch(url, { method: body ? 'POST' : 'GET', headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(Object.assign({ token: TOKEN }, body)) : undefined });
    const j = await r.json(); if (r.status === 401) { deconnecte(); } return j;
  } catch (e) { return { err: 'Connexion perdue…' }; }
}
function deconnecte() { localStorage.removeItem('fs_token'); TOKEN = ''; $('jeu').classList.add('hide'); $('login').classList.remove('hide'); }
function setEtat(e) { if (!e) return; ME = e; majHUD(); }

// ---------- interface ----------
function toast(t, ms) { const d = document.createElement('div'); d.className = 'toast'; d.innerHTML = t; $('toasts').appendChild(d); setTimeout(() => d.remove(), ms || 3200); while ($('toasts').children.length > 4) $('toasts').firstChild.remove(); }
function majHUD() {
  if (!ME) return;
  $('argent').textContent = fmt(ME.argent);
  $('niv').textContent = 'Niveau ' + ME.niv + ' • ' + ME.sac.length + '/' + DATA.SAC_MAX + ' 🐟';
  $('xpbar').firstChild.style.width = clamp((ME.xp - ME.xpNiv) / (ME.xpSuiv - ME.xpNiv) * 100, 0, 100) + '%';
  const ap = ME.appat && ME.appats[ME.appat] ? AMAP[ME.appat].nom + ' ×' + ME.appats[ME.appat] : 'Aucun appât';
  const en = ME.enchants[ME.canne] ? ' ✨' + EMAPC[ME.enchants[ME.canne]].nom : '';
  $('appatInfo').textContent = '🪱 ' + ap + ' • 🎣 ' + CMAP[ME.canne].nom + en;
  $('slot1').classList.toggle('on', player.rodOut);
}
const ICON_METEO = { soleil: '☀️ Soleil', nuageux: '☁️ Nuageux', pluie: '🌧️ Pluie', brouillard: '🌫️ Brouillard' };
function heureNow() { return (worldH + (performance.now() - worldT0) / jourMs * 24) % 24; }
function estJour(h) { return h >= 6 && h < 19; }

function openPanel(titre, html) { $('ptitre').innerHTML = titre; $('pcont').innerHTML = html; $('panel').classList.remove('hide'); panelOpen = true; annulerPeche(); }
function closePanel() { $('panel').classList.add('hide'); panelOpen = false; curPanel = null; }
let curPanel = null;
$('pclose').onclick = closePanel;
$('panel').addEventListener('mousedown', e => { if (e.target === $('panel')) closePanel(); });

function rangeBadge(r) { const R = DATA.RARETES[r]; return '<span style="color:' + R.coul + ';font-weight:900">' + R.nom + '</span>'; }
function mutNom(m) { const x = DATA.MUTATIONS.find(q => q.id === m); return x ? '<span style="color:#ffe066">✨ ' + x.nom + '</span> ' : ''; }
function emojiPoisson(id) { return { crabe: '🦀', poulpe: '🐙', calmar: '🦑', hippocampe: '🐉', requin: '🦈', baleine: '🐋', axolotl: '🦎', esprit: '👻', dragon: '🐉', clown: '🐠', lune: '🐡' }[id] || '🐟'; }

function panelSac(vente) {
  curPanel = vente ? 'vente' : 'sac';
  const sac = ME.sac.slice().sort((a, b) => b.valeur - a.valeur);
  const total = sac.reduce((s, f) => s + f.valeur, 0);
  let h = '<div class="row"><div class="info"><div class="t">' + sac.length + ' / ' + DATA.SAC_MAX + ' poissons</div><div class="s">Valeur totale : <b style="color:#7dff8a">' + fmt(total) + '</b></div></div></div>';
  if (vente) {
    h += '<div class="tabs"><button class="btn vert" data-v="99">💰 Tout vendre</button><button class="btn" data-v="1">Vendre Communs + Peu communs</button><button class="btn gris" data-v="2">… + Rares</button></div>';
  } else h += '<div class="s" style="margin:6px 2px;opacity:.8">Va voir le 💰 Marchand près du ponton pour vendre tes poissons.</div>';
  if (!sac.length) h += '<div class="row"><div class="info">Ton sac est vide. Va pêcher ! 🎣</div></div>';
  for (const f of sac) {
    const p = PMAP[f.id];
    h += '<div class="row"><div class="ic">' + emojiPoisson(f.id) + '</div><div class="info"><div class="t">' + (f.lock ? '🔒 ' : '') + mutNom(f.mut) + p.nom + '</div><div class="s">' + rangeBadge(p.r) + ' • ' + f.kg + ' kg</div></div><div style="font-weight:900;color:#7dff8a">' + fmt(f.valeur) + '</div>' +
      '<button class="btn gris" data-l="' + f.uid + '" title="Verrouiller">' + (f.lock ? '🔓' : '🔒') + '</button>' + (vente && !f.lock ? '<button class="btn vert" data-u="' + f.uid + '">Vendre</button>' : '') + '</div>';
  }
  h = h.replace('</div></div><div class="tabs">', '</div></div><div class="s" style="margin:4px 2px;opacity:.8">🔒 = poisson verrouillé, il ne sera jamais vendu.</div><div class="tabs">');
  openPanel(vente ? '💰 Marchand' : '🎒 Ton sac', h);
  $('pcont').querySelectorAll('[data-v]').forEach(b => b.onclick = async () => { const r = await api('/api/vendre', { rareteMax: +b.dataset.v }); vendu(r); });
  $('pcont').querySelectorAll('[data-u]').forEach(b => b.onclick = async () => { const r = await api('/api/vendre', { uids: [b.dataset.u] }); vendu(r); });
  $('pcont').querySelectorAll('[data-l]').forEach(b => b.onclick = async () => { const r = await api('/api/verrou', { uid: b.dataset.l }); if (r.err) return toast('❌ ' + r.err); setEtat(r.etat); panelSac(vente); });
}
function vendu(r) {
  if (r.err) return toast('❌ ' + r.err);
  setEtat(r.etat); if (r.n) { toast('💰 Tu as vendu ' + r.n + ' poisson' + (r.n > 1 ? 's' : '') + ' pour <b style="color:#7dff8a">' + fmt(r.total) + '</b> !'); son('cash'); } panelSac(true);
}
function barre(v, max, coul) { return '<span style="display:inline-block;width:60px;height:7px;background:#0006;border-radius:4px;vertical-align:middle;overflow:hidden"><span style="display:block;height:100%;width:' + clamp(v / max * 100, 4, 100) + '%;background:' + coul + '"></span></span>'; }
const NOM_LIEU = { depart: "l'Île de Départ", braise: "l'Île Braise", givre: "l'Île Givre", marais: 'le Marais Brumeux', recif: 'le Récif Perdu' };
function panelCannes(lieu) {
  lieu = lieu || 'depart'; curPanel = 'cannes';
  let h = '<div class="s" style="margin:0 2px 6px;opacity:.85">Vitesse = ça mord plus vite • Contrôle = barre plus grande • Force = le poisson s\\'échappe moins • Chance = poissons plus rares</div>';
  const autres = DATA.CANNES.filter(c => c.lieu !== lieu && !ME.cannes.includes(c.id)).map(c => c.nom + ' (' + NOM_LIEU[c.lieu] + ')');
  if (autres.length) h += '<div class="s" style="margin:0 2px 6px;opacity:.75">🗺️ D\\'autres cannes se vendent ailleurs : ' + autres.join(', ') + '</div>';
  for (const c of DATA.CANNES.filter(c => c.lieu === lieu || ME.cannes.includes(c.id))) {
    const a = ME.cannes.includes(c.id), eq = ME.canne === c.id, bloque = ME.niv < c.niv;
    h += '<div class="row"><div class="ic">🎣</div><div class="info"><div class="t"><span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:' + c.coul + ';border:2px solid #fff;margin-right:6px;vertical-align:-1px"></span>' + c.nom + '</div><div class="s">' +
      '<span class="stat">Vitesse ' + barre(c.lure - 0.9, 1.2, '#5fe0ff') + '</span><span class="stat">Contrôle ' + barre(c.control - 0.17, 0.19, '#7dff8a') + '</span><span class="stat">Force ' + barre(c.resil + 3, 38, '#ff8a20') + '</span><span class="stat">Chance ' + barre(c.chance + 5, 165, '#ffe066') + '</span></div></div>' +
      (eq ? '<button class="btn gris" disabled>Équipée</button>' : a ? '<button class="btn" data-eq="' + c.id + '">Équiper</button>' : bloque ? '<button class="btn gris" disabled>🔒 Niv. ' + c.niv + '</button>' : '<button class="btn vert" data-buy="' + c.id + '" ' + (ME.argent < c.prix ? 'disabled' : '') + '>' + fmt(c.prix) + '</button>') + '</div>';
  }
  openPanel('🎣 Boutique de Cannes — ' + NOM_LIEU[lieu], h);
  $('pcont').querySelectorAll('[data-buy]').forEach(b => b.onclick = async () => { const r = await api('/api/acheter', { type: 'canne', id: b.dataset.buy }); if (r.err) return toast('❌ ' + r.err); setEtat(r.etat); son('cash'); toast('🎉 Nouvelle canne : ' + CMAP[b.dataset.buy].nom + ' !'); panelCannes(lieu); });
  $('pcont').querySelectorAll('[data-eq]').forEach(b => b.onclick = async () => { const r = await api('/api/equiper', { type: 'canne', id: b.dataset.eq }); setEtat(r.etat); panelCannes(lieu); });
}
function panelAppats() {
  curPanel = 'appats';
  let h = '';
  for (const a of DATA.APPATS) {
    const n = ME.appats[a.id] || 0, eq = ME.appat === a.id;
    h += '<div class="row"><div class="ic">🪱</div><div class="info"><div class="t">' + a.nom + ' <span style="opacity:.8">(tu en as ' + n + ')</span></div><div class="s">' + a.desc + ' • ' + a.qte + ' utilisations</div></div>' +
      '<button class="btn vert" data-buy="' + a.id + '" ' + (ME.argent < a.prix ? 'disabled' : '') + '>' + fmt(a.prix) + '</button>' +
      (n ? (eq ? '<button class="btn gris" data-eq="">Enlever</button>' : '<button class="btn" data-eq="' + a.id + '">Mettre</button>') : '') + '</div>';
  }
  openPanel('🪱 Stand d\\'Appâts', h);
  $('pcont').querySelectorAll('[data-buy]').forEach(b => b.onclick = async () => { const r = await api('/api/acheter', { type: 'appat', id: b.dataset.buy }); if (r.err) return toast('❌ ' + r.err); setEtat(r.etat); son('cash'); panelAppats(); });
  $('pcont').querySelectorAll('[data-eq]').forEach(b => b.onclick = async () => { const r = await api('/api/equiper', { type: 'appat', id: b.dataset.eq }); setEtat(r.etat); panelAppats(); });
}
function panelTotems() {
  curPanel = 'totems';
  let h = '<div class="s" style="margin:0 2px 6px;opacity:.85">⚠️ Un totem change le temps pour TOUS les joueurs du serveur !</div>';
  const ic = { soleil: '☀️', lune: '🌙', pluie: '🌧️', brume: '🌫️' };
  for (const t of DATA.TOTEMS) h += '<div class="row"><div class="ic">' + ic[t.id] + '</div><div class="info"><div class="t">' + t.nom + '</div><div class="s">' + t.desc + '</div></div><button class="btn vert" data-t="' + t.id + '" ' + (ME.argent < t.prix ? 'disabled' : '') + '>' + fmt(t.prix) + '</button></div>';
  openPanel('🗿 Sanctuaire des Totems', h);
  $('pcont').querySelectorAll('[data-t]').forEach(b => b.onclick = async () => { const r = await api('/api/acheter', { type: 'totem', id: b.dataset.t }); if (r.err) return toast('❌ ' + r.err); setEtat(r.etat); setMonde(r.monde); son('magie'); closePanel(); });
}
function panelCarnet() {
  curPanel = 'carnet';
  const zones = [['etang', '🌿 Étang'], ['cote', '🏖️ Côte'], ['large', '🌊 Large (pleine mer)'], ['braise', '🌋 Île Braise'], ['givre', '❄️ Île Givre'], ['marais', '🌫️ Marais Brumeux'], ['recif', '🐠 Récif Perdu']];
  const nb = Object.keys(ME.carnet).length;
  let h = '<div class="row"><div class="info"><div class="t">' + nb + ' / ' + DATA.POISSONS.length + ' poissons découverts</div><div class="s">' + ME.prises + ' poissons attrapés au total</div></div></div>';
  const mom = { jour: '☀️ Jour', nuit: '🌙 Nuit', tous: '' }, met = { soleil: '☀️ Soleil', nuageux: '☁️ Nuageux', pluie: '🌧️ Pluie', brouillard: '🌫️ Brouillard' };
  for (const [z, zn] of zones) {
    h += '<div class="t" style="font-weight:900;margin:12px 2px 6px">' + zn + '</div><div class="grid">';
    for (const p of DATA.POISSONS.filter(q => q.zone === z).sort((a, b) => a.r - b.r)) {
      const c = ME.carnet[p.id]; const R = DATA.RARETES[p.r];
      const cond = [mom[p.moment], p.meteo ? met[p.meteo] : ''].filter(Boolean).join(' • ') || 'Toujours';
      h += '<div class="card" style="border-color:' + (c ? R.coul : '#0000') + '"><div style="font-size:28px">' + (c ? emojiPoisson(p.id) : '❔') + '</div><div class="t">' + (c ? p.nom : '???') + '</div><div class="s">' + rangeBadge(p.r) + '</div><div class="s">' + (c ? 'Pris ×' + c.n + ' • record ' + c.max + ' kg' : cond) + '</div></div>';
    }
    h += '</div>';
  }
  openPanel('📖 Carnet des poissons', h);
}
function panelBateaux(spawn) {
  curPanel = 'bateaux';
  let h = '<div class="s" style="margin:0 2px 6px;opacity:.85">Achète un bateau, puis clique sur « Mettre à l\\'eau ». Approche-toi et appuie sur E pour monter. ZQSD pour conduire, E pour descendre.</div>';
  for (const bt of DATA.BATEAUX) {
    const a = ME.bateaux.includes(bt.id), bloque = ME.niv < bt.niv;
    h += '<div class="row"><div class="ic">' + ({ barque: '🛶', moteur: '🚤', vedette: '🏎️', yacht: '🛥️' }[bt.id]) + '</div><div class="info"><div class="t">' + bt.nom + '</div><div class="s">' + bt.desc + ' • Vitesse ' + barre(bt.vitesse, 30, '#5fe0ff') + '</div></div>' +
      (a ? '<button class="btn vert" data-sp="' + bt.id + '">⚓ Mettre à l\\'eau</button>' : bloque ? '<button class="btn gris" disabled>🔒 Niv. ' + bt.niv + '</button>' : '<button class="btn jaune" data-buy="' + bt.id + '" ' + (ME.argent < bt.prix ? 'disabled' : '') + '>' + fmt(bt.prix) + '</button>') + '</div>';
  }
  openPanel('⚓ Chantier Naval', h);
  $('pcont').querySelectorAll('[data-buy]').forEach(b => b.onclick = async () => { const r = await api('/api/acheter', { type: 'bateau', id: b.dataset.buy }); if (r.err) return toast('❌ ' + r.err); setEtat(r.etat); son('cash'); toast('🎉 Nouveau bateau : ' + BMAPC[b.dataset.buy].nom + ' !'); panelBateaux(spawn); });
  $('pcont').querySelectorAll('[data-sp]').forEach(b => b.onclick = () => {
    if (myBoat && myBoat.on) descendreBateau();
    myBoat = { t: b.dataset.sp, x: spawn[0], z: spawn[1], ry: spawn[2], v: 0, on: false };
    closePanel(); son('plouf'); toast('⚓ Ton ' + BMAPC[myBoat.t].nom + ' t\\'attend à côté du ponton ! Approche-toi et appuie sur E.');
  });
}
function panelEnchant() {
  curPanel = 'enchant';
  const c = CMAP[ME.canne], e = ME.enchants[ME.canne] ? EMAPC[ME.enchants[ME.canne]] : null;
  let h = '<div class="row"><div class="ic">🎣</div><div class="info"><div class="t">' + c.nom + '</div><div class="s">Enchantement actuel : ' + (e ? '<b style="color:#ffe066">✨ ' + e.nom + '</b> — ' + e.desc : 'aucun') + '</div></div></div>';
  h += '<div class="row"><div class="ic">💎</div><div class="info"><div class="t">Pierre d\\'Enchantement</div><div class="s">Tu en as ' + ME.reliques + '. Elle donne un enchantement au hasard à ta canne équipée.</div></div><button class="btn jaune" id="bRel" ' + (ME.argent < DATA.PRIX_RELIQUE ? 'disabled' : '') + '>' + fmt(DATA.PRIX_RELIQUE) + '</button></div>';
  h += '<div style="text-align:center;margin:12px"><button class="btn vert" id="bEnch" ' + (ME.reliques > 0 ? '' : 'disabled') + ' style="font-size:19px;padding:14px 26px">✨ ENCHANTER MA CANNE</button></div>';
  h += '<div class="t" style="font-weight:900;margin:8px 2px">Enchantements possibles :</div>';
  for (const x of DATA.ENCHANTS) h += '<div class="row"><div class="ic">✨</div><div class="info"><div class="t">' + x.nom + '</div><div class="s">' + x.desc + '</div></div></div>';
  openPanel('🔮 Autel d\\'Enchantement', h);
  $('bRel').onclick = async () => { const r = await api('/api/acheter', { type: 'relique' }); if (r.err) return toast('❌ ' + r.err); setEtat(r.etat); son('cash'); panelEnchant(); };
  $('bEnch').onclick = async () => { const r = await api('/api/enchanter', {}); if (r.err) return toast('❌ ' + r.err); setEtat(r.etat); son('magie'); toast('✨ Ta canne est maintenant <b style="color:#ffe066">' + EMAPC[r.enchant].nom + '</b> !', 4500); panelEnchant(); };
}
function panelEvaluer() {
  curPanel = 'evaluer';
  let h = '<div class="s" style="margin:0 2px 8px;opacity:.85">L\\'Évaluateur change le poids de ton poisson au hasard, et il peut lui donner une mutation ✨. Attention : ça peut aussi baisser sa valeur !</div>';
  const sac = ME.sac.slice().sort((a, b) => b.valeur - a.valeur);
  if (!sac.length) h += '<div class="row"><div class="info">Ton sac est vide.</div></div>';
  for (const f of sac) { const p = PMAP[f.id]; const prix = Math.max(50, Math.round(f.valeur * 0.2));
    h += '<div class="row"><div class="ic">' + emojiPoisson(f.id) + '</div><div class="info"><div class="t">' + mutNom(f.mut) + p.nom + '</div><div class="s">' + rangeBadge(p.r) + ' • ' + f.kg + ' kg • ' + fmt(f.valeur) + '</div></div><button class="btn jaune" data-ev="' + f.uid + '" ' + (ME.argent < prix ? 'disabled' : '') + '>🔍 ' + fmt(prix) + '</button></div>'; }
  openPanel('🔍 Évaluateur', h);
  $('pcont').querySelectorAll('[data-ev]').forEach(b => b.onclick = async () => { const r = await api('/api/evaluer', { uid: b.dataset.ev }); if (r.err) return toast('❌ ' + r.err); setEtat(r.etat); son('magie'); const f = r.poisson; toast('🔍 ' + mutNom(f.mut) + PMAP[f.id].nom + ' : ' + f.kg + ' kg • <b style="color:#7dff8a">' + fmt(f.valeur) + '</b>', 4000); panelEvaluer(); });
}
function panelCarte() {
  curPanel = 'carte';
  openPanel('🗺️ Carte', '<canvas id="carte" width="560" height="560" style="width:100%;max-width:560px;display:block;margin:auto;border-radius:14px;background:#1f6fa8"></canvas><div class="s" style="text-align:center;margin-top:8px;opacity:.85">🔴 = toi • ⛵ = ton bateau</div>');
  const cvs = $('carte'), g = cvs.getContext('2d'), sc = 560 / 640, X = x => 280 + x * sc, Z = z => 280 + z * sc;
  g.fillStyle = '#2a86c0'; for (let i = 0; i < 40; i++) { g.globalAlpha = 0.15; g.beginPath(); g.arc(Math.random() * 560, Math.random() * 560, 20 + Math.random() * 40, 0, 7); g.fill(); } g.globalAlpha = 1;
  const ile = (x, z, r, c, nom) => { g.fillStyle = '#e9d49b'; g.beginPath(); g.arc(X(x), Z(z), r * sc + 4, 0, 7); g.fill(); g.fillStyle = c; g.beginPath(); g.arc(X(x), Z(z), r * sc, 0, 7); g.fill(); g.fillStyle = '#fff'; g.font = 'bold 15px sans-serif'; g.textAlign = 'center'; g.strokeStyle = '#0008'; g.lineWidth = 4; g.strokeText(nom, X(x), Z(z) - r * sc - 10); g.fillText(nom, X(x), Z(z) - r * sc - 10); };
  ile(0, 0, 34, '#63b347', '🏝️ Île de Départ');
  for (const I of ILES) ile(I.x, I.z, I.R, { volcan: '#4a4440', glace: '#f2f6fa', marais: '#4a6a32', recif: '#7cc456' }[I.style], I.nom);
  if (myBoat) { g.font = '22px sans-serif'; g.fillText('⛵', X(myBoat.x), Z(myBoat.z) + 8); }
  g.fillStyle = '#ff3040'; g.strokeStyle = '#fff'; g.lineWidth = 3; g.beginPath(); g.arc(X(player.x), Z(player.z), 7, 0, 7); g.fill(); g.stroke();
}
async function panelTop() {
  const r = await api('/api/classement');
  let h = ''; (r.liste || []).forEach((u, i) => { h += '<div class="row"><div class="ic">' + (['🥇', '🥈', '🥉'][i] || (i + 1)) + '</div><div class="info"><div class="t">' + u.nom + '</div><div class="s">Niveau ' + u.niv + ' • ' + u.prises + ' poissons</div></div><div style="font-weight:900;color:#7dff8a">' + fmt(u.gagne) + '</div></div>'; });
  openPanel('🏆 Les meilleurs pêcheurs', h || 'Personne encore…');
}
$('bSac').onclick = () => panelSac(false);
$('bCarnet').onclick = panelCarnet;
$('bTop').onclick = panelTop;
$('bCarte').onclick = panelCarte;
$('slot1').onclick = () => toggleCanne();

// ---------- PNJ ----------
const NPCS = [
  { id: 'marchand', nom: '💰 Marchand', x: 18, z: 8.6, ry: Math.PI, ix: 18, iz: 5, shirt: hex('#2b9be0'), hat: hex('#ffffff'), act: () => panelSac(true) },
  { id: 'cannes', nom: '🎣 Boutique de Cannes', x: 18, z: -5.8, ry: 0, ix: 18, iz: -4.6, shirt: hex('#d8423a'), hat: hex('#e9c46a'), act: () => panelCannes('depart') },
  { id: 'appats', nom: '🪱 Appâts', x: 25.5, z: -2.6, ry: 0, ix: 25.5, iz: -1.8, shirt: hex('#3fbf55'), hat: hex('#7a5230'), act: panelAppats },
  { id: 'totems', nom: '🗿 Totems', x: 7, z: -14.2, ry: 0, ix: 7, iz: -13.2, shirt: hex('#8a5cd8'), hat: hex('#3a2a6a'), act: panelTotems },
  { id: 'chantier', nom: '⚓ Chantier Naval', x: 24.5, z: 4.6, ry: Math.PI, ix: 24.5, iz: 2.6, shirt: hex('#1f3f6a'), hat: hex('#f2f2ee'), act: () => panelBateaux([36, -7, Math.PI / 2]) }
];
const ROLES_ILES = {
  braise: [['marchand', '💰 Marchand'], ['cannes', '🎣 Cannes'], ['enchant', '🔮 Autel d\\'Enchantement']],
  givre: [['marchand', '💰 Marchand'], ['cannes', '🎣 Cannes'], ['evaluer', '🔍 Évaluateur']],
  marais: [['marchand', '💰 Marchand'], ['cannes', '🎣 Cannes'], ['appats', '🪱 Appâts']],
  recif: [['marchand', '💰 Marchand'], ['cannes', '🎣 Cannes'], ['chantier', '⚓ Chantier Naval']]
};
const TENUES = { marchand: ['#2b9be0', '#ffffff'], cannes: ['#d8423a', '#e9c46a'], enchant: ['#6a2ab0', '#2a1a5a'], evaluer: ['#e0e0e0', '#3a3a3a'], appats: ['#3fbf55', '#7a5230'], chantier: ['#1f3f6a', '#f2f2ee'] };
for (const I of ILES) {
  ROLES_ILES[I.id].forEach(([role, nom], k) => {
    const v = (k - 1) * 5.5, u = I.R - 9;
    const x = I.x + I.dx * u + I.px * v, z = I.z + I.dz * u + I.pz * v;
    const spawn = [I.x + I.dx * (I.R + 8) + I.px * 9, I.z + I.dz * (I.R + 8) + I.pz * 9, I.ry];
    const act = role === 'marchand' ? () => panelSac(true) : role === 'cannes' ? () => panelCannes(I.id) : role === 'enchant' ? panelEnchant : role === 'evaluer' ? panelEvaluer : role === 'appats' ? panelAppats : () => panelBateaux(spawn);
    NPCS.push({ id: I.id + '_' + role, nom, x, z, ry: I.ry, ix: x + I.dx * 1.6, iz: z + I.dz * 1.6, shirt: hex(TENUES[role][0]), hat: hex(TENUES[role][1]), act, ile: I });
  });
}
let npcProche = null;
for (const n of NPCS) COLLIDERS.push({ x: n.x, z: n.z, r: 0.45 });

// ---------- labels HTML ----------
const labelEls = {};
function label(key, txt, cls) { let e = labelEls[key]; if (!e) { e = document.createElement('div'); e.className = 'label ' + (cls || ''); $('labels').appendChild(e); labelEls[key] = e; } if (e._t !== txt) { e.textContent = txt; e._t = txt; } e._used = true; return e; }
let VP = IDM, SW = 1, SH = 1;
function proj(x, y, z) { const m = VP; const cx = m[0] * x + m[4] * y + m[8] * z + m[12], cy = m[1] * x + m[5] * y + m[9] * z + m[13], cw = m[3] * x + m[7] * y + m[11] * z + m[15]; if (cw < 0.1) return null; return [(cx / cw + 1) / 2 * SW, (1 - cy / cw) / 2 * SH, cw]; }
function placeLabel(key, txt, x, y, z, cls, maxD) {
  const p = proj(x, y, z); const e = label(key, txt, cls);
  if (!p || p[2] > (maxD || 45)) { e.style.display = 'none'; return; }
  e.style.display = ''; e.style.left = p[0] + 'px'; e.style.top = p[1] + 'px';
}

// ---------- sons ----------
let AC = null;
function son(type) {
  try {
    if (!AC) AC = new (window.AudioContext || window.webkitAudioContext)();
    const t = AC.currentTime; const o = AC.createOscillator(), g = AC.createGain(); o.connect(g); g.connect(AC.destination);
    const seq = { plouf: [[300, 0, 0.12], [140, 0.08, 0.15]], shake: [[700, 0, 0.06]], touche: [[880, 0, 0.08], [1180, 0.09, 0.1]], prise: [[523, 0, 0.1], [659, 0.1, 0.1], [784, 0.2, 0.18]], rate: [[300, 0, 0.15], [200, 0.15, 0.25]], cash: [[988, 0, 0.07], [1319, 0.07, 0.15]], magie: [[400, 0, 0.1], [600, 0.1, 0.1], [900, 0.2, 0.1], [1200, 0.3, 0.2]] }[type] || [[500, 0, 0.1]];
    o.type = type === 'plouf' ? 'sine' : 'triangle'; g.gain.setValueAtTime(0.0001, t);
    for (const [f, d, l] of seq) { o.frequency.setValueAtTime(f, t + d); g.gain.setValueAtTime(0.13, t + d); g.gain.exponentialRampToValueAtTime(0.001, t + d + l); }
    o.start(t); o.stop(t + seq[seq.length - 1][1] + seq[seq.length - 1][2] + 0.05);
  } catch (e) { }
}

// =====================================================================
//  PÊCHE
// =====================================================================
function rodStats() {
  const c = CMAP[ME.canne]; const a = ME.appat && ME.appats[ME.appat] ? AMAP[ME.appat] : null; const e = EMAPC[ME.enchants[ME.canne]] || {};
  return { lure: c.lure * (1 + (a ? a.lure : 0) + (e.lure || 0)), control: c.control + (e.control || 0), resil: c.resil + (e.resil || 0) };
}
function toggleCanne(force) {
  player.rodOut = force === undefined ? !player.rodOut : force;
  if (!player.rodOut) annulerPeche();
  majHUD(); son('shake');
}
function commencerCharge() {
  if (panelOpen || F.st !== 'idle' || F.catchShow) return;
  if (!player.rodOut) { toast('🎣 Sors ta canne d\\'abord (touche 1)'); return; }
  if (player.swim) { toast('🏊 Tu ne peux pas pêcher en nageant !'); return; }
  if (myBoat && myBoat.on && Math.abs(myBoat.v) > 2) { toast('⛵ Arrête ton bateau pour pêcher'); return; }
  if (ME.sac.length >= DATA.SAC_MAX) { toast('🎒 Ton sac est plein ! Va vendre au 💰 Marchand.'); return; }
  F.st = 'charge'; F.power = 0; F.pdir = 1;
  player.ry = Math.atan2(-Math.sin(cam.yaw), -Math.cos(cam.yaw));
  $('power').classList.remove('hide');
}
function lancer() {
  if (F.st !== 'charge') return;
  $('power').classList.add('hide');
  const d = 3 + F.power * 16, dx = Math.sin(player.ry), dz = Math.cos(player.ry);
  F.from = F.tip ? F.tip.slice() : [player.x, player.y + 2, player.z];
  F.to = [player.x + dx * d, 0, player.z + dz * d];
  F.st = 'vol'; F.t = 0; F.power = 0;
}
function annulerPeche(msg) {
  if (F.st === 'idle') return;
  if (F.st === 'combat' || F.st === 'touche') api('/api/prise', { ok: false });
  F.st = 'idle'; F.reel = null; $('power').classList.add('hide'); $('reel').classList.add('hide'); viderShakes(); if (msg) toast(msg);
}
function viderShakes() { document.querySelectorAll('.shake').forEach(e => e.remove()); }
function spawnShake() {
  viderShakes();
  const e = document.createElement('div'); e.className = 'shake'; e.textContent = 'SECOUE !';
  e.style.left = (20 + Math.random() * 60) + '%'; e.style.top = (25 + Math.random() * 45) + '%';
  const go = ev => { ev.preventDefault(); ev.stopPropagation(); e.remove(); if (F.st === 'attente') { F.wait *= 0.8; F.wait -= 0.35; son('shake'); F.shakeT = 0.25; } };
  e.addEventListener('mousedown', go); e.addEventListener('touchstart', go, { passive: false });
  document.body.appendChild(e);
}
async function touche() {
  F.st = 'touche'; F.t = 0; viderShakes(); son('touche');
  const r = await api('/api/touche', { zone: zoneAt(F.bob[0], F.bob[2]) });
  if (F.st !== 'touche') return;
  if (r.err) { annulerPeche('❌ ' + r.err); return; }
  setEtat(r.etat);
  const st = rodStats(), R = DATA.RARETES[r.r];
  F.reel = { r: r.r, diff: R.diff, fish: 0.5, fv: 0, target: 0.5, ft: 0.4, bar: 0.5 - st.control / 2, vel: 0, w: st.control, prog: 0.3, resil: st.resil, acc: 0, tt: 0 };
  setTimeout(() => {
    if (F.st !== 'touche') return;
    F.st = 'combat';
    $('reel').classList.remove('hide');
    $('reelNom').innerHTML = '🎣 Un poisson ' + rangeBadge(r.r) + ' a mordu !';
    $('pbar').style.width = (F.reel.w * 100) + '%';
    trackW = $('track').clientWidth - 6;
  }, 650);
}
async function finCombat(ok) {
  $('reel').classList.add('hide');
  F.st = 'fin';
  const r = await api('/api/prise', { ok });
  F.st = 'idle';
  if (r.err) return toast('❌ ' + r.err);
  setEtat(r.etat);
  if (!ok) { son('rate'); toast('💨 Le poisson s\\'est échappé…'); return; }
  const f = r.poisson, p = PMAP[f.id], R = DATA.RARETES[p.r];
  son('prise');
  const e = $('prise'); e.style.borderColor = R.coul;
  e.innerHTML = '<div class="r" style="color:' + R.coul + '">' + R.nom + '</div><div class="n">' + mutNom(f.mut) + p.nom + '</div><div class="d">' + f.kg + ' kg • <b style="color:#7dff8a">' + fmt(f.valeur) + '</b></div>' + (r.nouveau ? '<div class="new">📖 NOUVEAU dans ton carnet !</div>' : '');
  e.classList.remove('hide'); clearTimeout(e._t); e._t = setTimeout(() => e.classList.add('hide'), 3200);
  F.catchShow = { id: f.id, t: 0, big: p.taille * (f.mut === 'geant' ? 1.5 : 1) };
  if (r.niveauUp) setTimeout(() => { toast('⭐ NIVEAU ' + r.niveauUp + ' ! De nouvelles cannes se débloquent peut-être…', 4500); son('magie'); }, 900);
}
let trackW = 500;
function stepReel(R, h) {
  R.tt += h;
  // le poisson : il choisit un endroit et y nage avec un ressort (mouvement doux)
  R.ft -= h;
  if (R.ft <= 0) {
    const saut = 0.22 + 0.4 * Math.min(1, R.diff / 3.2);
    R.target = clamp(R.fish + (Math.random() * 2 - 1) * saut, 0.03, 0.97);
    R.ft = (0.55 + Math.random() * 1.1) / Math.sqrt(R.diff);
  }
  const k = 5 + 4 * R.diff, damp = 2 * Math.sqrt(k) * 0.85;
  R.fv += ((R.target - R.fish) * k - R.fv * damp) * h;
  R.fish += R.fv * h;
  if (R.fish < 0.02) { R.fish = 0.02; R.fv = Math.abs(R.fv) * 0.3; } if (R.fish > 0.98) { R.fish = 0.98; R.fv = -Math.abs(R.fv) * 0.3; }
  // ta barre : maintenir = monter vers la droite, lâcher = redescendre
  R.vel += (holdInput ? 2.7 : -2.7) * h; R.vel *= (1 - 0.8 * h); R.vel = clamp(R.vel, -1.25, 1.25);
  R.bar += R.vel * h;
  if (R.bar < 0) { R.bar = 0; R.vel = -R.vel * 0.3; } if (R.bar > 1 - R.w) { R.bar = 1 - R.w; R.vel = -R.vel * 0.3; }
  const dedans = R.fish >= R.bar && R.fish <= R.bar + R.w;
  if (dedans) R.prog += h * 0.2 * (1 + R.resil / 60) / (0.6 + R.diff * 0.4);
  else R.prog -= h * (0.085 + R.diff * 0.033) * (1 - R.resil / 100);
}
function majPeche(dt, t) {
  if (F.st === 'charge') {
    F.power += F.pdir * dt * 0.9; if (F.power > 1) { F.power = 1; F.pdir = -1; } if (F.power < 0) { F.power = 0; F.pdir = 1; }
    $('power').firstChild.style.height = (F.power * 100) + '%';
  } else if (F.st === 'vol') {
    F.t += dt / 0.75; const k = Math.min(F.t, 1);
    F.bob = [lerp(F.from[0], F.to[0], k), lerp(F.from[1], 0, k) + Math.sin(k * Math.PI) * 3.5, lerp(F.from[2], F.to[2], k)];
    if (F.t >= 1) {
      const x = F.to[0], z = F.to[2];
      if (H(x, z) > -0.25) { annulerPeche('🪨 Il faut lancer dans l\\'eau !'); return; }
      F.st = 'attente'; son('plouf');
      const st = rodStats(); F.wait = (4 + Math.random() * 7) / st.lure; F.shakeT = 0; F.nextShake = 0.6;
    }
  } else if (F.st === 'attente') {
    F.wait -= dt; F.nextShake -= dt; F.shakeT = Math.max(0, F.shakeT - dt);
    F.bob = [F.to[0], waveY(F.to[0], F.to[2], t) + 0.05 - F.shakeT * 0.3, F.to[2]];
    if (F.nextShake <= 0) { spawnShake(); F.nextShake = 1.1 + Math.random() * 0.6; }
    if (F.wait <= 0) touche();
  } else if (F.st === 'touche') {
    F.t += dt; F.bob = [F.to[0], waveY(F.to[0], F.to[2], t) - 0.25 + Math.sin(F.t * 30) * 0.08, F.to[2]];
  } else if (F.st === 'combat' && F.reel) {
    const R = F.reel;
    F.bob = [F.to[0] + Math.sin(t * 7) * 0.2, waveY(F.to[0], F.to[2], t) - 0.15 + Math.sin(t * 23) * 0.05, F.to[2] + Math.cos(t * 5) * 0.2];
    // physique en petits pas fixes = très fluide
    R.acc += dt; const h = 1 / 240;
    while (R.acc >= h) { R.acc -= h; stepReel(R, h); if (R.prog >= 1 || R.prog <= 0) break; }
    const dedans = R.fish >= R.bar && R.fish <= R.bar + R.w;
    $('pbar').style.transform = 'translateX(' + (R.bar * trackW).toFixed(1) + 'px)'; $('pbar').classList.toggle('in', dedans);
    $('ficon').style.transform = 'translateX(' + (R.fish * trackW).toFixed(1) + 'px) scaleX(' + (R.fv < 0 ? -1 : 1) + ')';
    $('prog').firstChild.style.width = clamp(R.prog * 100, 0, 100) + '%';
    if (R.prog >= 1) finCombat(true); else if (R.prog <= 0) finCombat(false);
  }
  if (F.catchShow) { F.catchShow.t += dt; if (F.catchShow.t > 2.4) F.catchShow = null; }
}

// =====================================================================
//  ENTRÉES
// =====================================================================
let drag = null;
cv.addEventListener('contextmenu', e => e.preventDefault());
cv.addEventListener('mousedown', e => {
  if (e.button === 2 || e.button === 1) { drag = { x: e.clientX, y: e.clientY }; return; }
  if (e.button === 0) { mouseL = true; holdInput = true; if (F.st === 'idle') commencerCharge(); }
});
window.addEventListener('mousemove', e => { if (drag) { cam.yaw -= (e.clientX - drag.x) * 0.006; cam.pitch = clamp(cam.pitch + (e.clientY - drag.y) * 0.005, 0.05, 1.3); drag = { x: e.clientX, y: e.clientY }; } });
window.addEventListener('mouseup', e => { if (e.button === 0) { mouseL = false; holdInput = keys.Space || false; if (F.st === 'charge') lancer(); } else drag = null; });
cv.addEventListener('wheel', e => { cam.dist = clamp(cam.dist + e.deltaY * 0.01, 4, 22); e.preventDefault(); }, { passive: false });
window.addEventListener('keydown', e => {
  if (e.target.tagName === 'INPUT') return;
  keys[e.code] = true;
  if (e.code === 'Space') { e.preventDefault(); if (F.st === 'combat' || F.st === 'touche') holdInput = true; else if (!e.repeat) sauter(); }
  if (e.code === 'KeyE' && !e.repeat) { if (panelOpen) closePanel(); else if (npcProche) npcProche.act(); }
  if (e.code === 'Digit1' && !e.repeat && !panelOpen) toggleCanne();
  if (e.code === 'KeyM' && !e.repeat) { if (curPanel === 'carte') closePanel(); else if (!panelOpen) panelCarte(); }
  if (e.code === 'Escape') closePanel();
  if (e.code === 'KeyR') annulerPeche();
  if (e.code === 'KeyI' && !panelOpen) panelSac(false); else if (e.code === 'KeyI' && curPanel === 'sac') closePanel();
  if (e.code === 'KeyB' && !panelOpen) panelCarnet(); else if (e.code === 'KeyB' && curPanel === 'carnet') closePanel();
});
window.addEventListener('keyup', e => { keys[e.code] = false; if (e.code === 'Space') holdInput = mouseL; });
window.addEventListener('blur', () => { for (const k in keys) keys[k] = false; holdInput = false; mouseL = false; });
// tactile
const joy = { id: null, x: 0, y: 0, dx: 0, dz: 0 }; let camTouch = null;
$('joy').addEventListener('touchstart', e => { const t = e.changedTouches[0]; joy.id = t.identifier; const r = $('joy').getBoundingClientRect(); joy.cx = r.left + r.width / 2; joy.cy = r.top + r.height / 2; e.preventDefault(); }, { passive: false });
cv.addEventListener('touchstart', e => { for (const t of e.changedTouches) if (camTouch === null) camTouch = { id: t.identifier, x: t.clientX, y: t.clientY }; }, { passive: true });
window.addEventListener('touchmove', e => {
  for (const t of e.changedTouches) {
    if (t.identifier === joy.id) { let dx = t.clientX - joy.cx, dy = t.clientY - joy.cy; const l = Math.hypot(dx, dy); if (l > 50) { dx *= 50 / l; dy *= 50 / l; } joy.dx = dx / 50; joy.dz = dy / 50; $('joyK').style.transform = 'translate(' + dx + 'px,' + dy + 'px)'; }
    else if (camTouch && t.identifier === camTouch.id) { cam.yaw -= (t.clientX - camTouch.x) * 0.008; cam.pitch = clamp(cam.pitch + (t.clientY - camTouch.y) * 0.006, 0.05, 1.3); camTouch.x = t.clientX; camTouch.y = t.clientY; }
  }
}, { passive: true });
window.addEventListener('touchend', e => { for (const t of e.changedTouches) { if (t.identifier === joy.id) { joy.id = null; joy.dx = joy.dz = 0; $('joyK').style.transform = ''; } if (camTouch && t.identifier === camTouch.id) camTouch = null; } });
$('bCast').addEventListener('touchstart', e => { e.preventDefault(); holdInput = true; if (F.st === 'idle') commencerCharge(); }, { passive: false });
$('bCast').addEventListener('touchend', e => { e.preventDefault(); holdInput = false; if (F.st === 'charge') lancer(); }, { passive: false });
$('bE').addEventListener('touchstart', e => { e.preventDefault(); if (npcProche && !panelOpen) npcProche.act(); else if (F.st !== 'idle') annulerPeche(); }, { passive: false });
$('bSaut').addEventListener('touchstart', e => { e.preventDefault(); sauter(); }, { passive: false });
$('prompt').onclick = () => { if (npcProche) npcProche.act(); };

// =====================================================================
//  JOUEUR
// =====================================================================
function sauter() {
  if (panelOpen || player.air || player.swim || (myBoat && myBoat.on)) return;
  if (F.st !== 'idle') annulerPeche();
  player.vy = 7.8; player.air = true;
}
function monterBateau() { if (!myBoat) return; annulerPeche(); myBoat.on = true; myBoat.v = 0; cam.dist = Math.max(cam.dist, 12); toast('⛵ ZQSD pour conduire • E pour descendre', 2500); }
function descendreBateau() {
  if (!myBoat) return; annulerPeche(); myBoat.on = false; myBoat.v = 0;
  let best = null, bd = 1e9;
  for (let r = 2.5; r <= 9; r += 1.5) for (let k = 0; k < 16; k++) { const a = k / 16 * 6.283, x = myBoat.x + Math.cos(a) * r, z = myBoat.z + Math.sin(a) * r; const g = groundY(x, z); if ((g > -0.25 || onDock(x, z)) && r < bd) { bd = r; best = [x, z]; } }
  if (!best) best = [myBoat.x + Math.cos(myBoat.ry) * 2.2, myBoat.z - Math.sin(myBoat.ry) * 2.2];
  player.x = best[0]; player.z = best[1]; player.y = Math.max(groundY(best[0], best[1]), -1); player.vy = 0;
}
let bumpT = 0;
function majBateau(dt, ix, iz) {
  const BD = BMAPC[myBoat.t], bi = BOAT_INFO[myBoat.t];
  const thr = -iz; const tv = thr > 0.1 ? BD.vitesse * Math.min(1, thr) : thr < -0.1 ? -BD.vitesse * 0.35 : 0;
  const acc = tv === 0 ? 5 : 7;
  myBoat.v += clamp(tv - myBoat.v, -acc * dt, acc * dt);
  if (Math.abs(myBoat.v) > 2 && F.st !== 'idle') annulerPeche();
  const turn = BD.virage * clamp(Math.abs(myBoat.v) / 6, 0.3, 1) * (myBoat.v < -0.1 ? -1 : 1);
  myBoat.ry -= ix * turn * dt;
  const sx = Math.sin(myBoat.ry), sz = Math.cos(myBoat.ry);
  const nx = myBoat.x + sx * myBoat.v * dt, nz = myBoat.z + sz * myBoat.v * dt;
  const sg = myBoat.v >= 0 ? 1 : -1, fx = nx + sx * bi.len / 2 * sg, fz = nz + sz * bi.len / 2 * sg;
  if (H(fx, fz) > -0.7 || H(nx, nz) > -0.7 || onDock(fx, fz)) { if (Math.abs(myBoat.v) > 4) { bumpT -= dt; if (bumpT <= 0) { toast('💥 Attention, ça touche le fond !'); son('rate'); bumpT = 2; } } myBoat.v = -myBoat.v * 0.25; }
  else { myBoat.x = nx; myBoat.z = nz; }
  if (Math.abs(myBoat.x) > 330) myBoat.x = Math.sign(myBoat.x) * 330; if (Math.abs(myBoat.z) > 330) myBoat.z = Math.sign(myBoat.z) * 330;
  player.x = myBoat.x - sx * bi.len * 0.12; player.z = myBoat.z - sz * bi.len * 0.12; player.ry = myBoat.ry;
  player.y = waveY(myBoat.x, myBoat.z, performance.now() / 1000) + bi.deck; player.moving = false; player.swim = false; player.air = false;
  if (Math.abs(myBoat.v) > 1.5 && !drag) { let d = (myBoat.ry + Math.PI) - cam.yaw; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; cam.yaw += d * Math.min(1, dt * 1.8); }
}
function majJoueur(dt) {
  let ix = 0, iz = 0;
  if (!panelOpen) {
    if (keys.KeyW || keys.ArrowUp) iz -= 1; if (keys.KeyS || keys.ArrowDown) iz += 1;
    if (keys.KeyA || keys.ArrowLeft) ix -= 1; if (keys.KeyD || keys.ArrowRight) ix += 1;
    ix += joy.dx; iz += joy.dz;
  }
  if (myBoat && myBoat.on) majBateau(dt, ix, iz);
  else {
    const l = Math.hypot(ix, iz);
    player.moving = l > 0.15;
    if (player.moving) {
      if (F.st !== 'idle' && F.st !== 'fin') annulerPeche();
      if (l > 1) { ix /= l; iz /= l; }
      const sy = Math.sin(cam.yaw), cy = Math.cos(cam.yaw);
      const fx = -sy, fz = -cy, rx = cy, rz = -sy;
      const dx = (rx * ix - fx * iz), dz = (rz * ix - fz * iz);
      const sp = player.swim ? 3.8 : keys.ShiftLeft ? 9.5 : 6.2;
      const nx = player.x + dx * sp * dt, nz = player.z + dz * sp * dt;
      const g0 = Math.max(groundY(player.x, player.z), -0.9);
      const ok = (x, z) => {
        const g = groundY(x, z);
        if (g > -0.9 && g - Math.max(g0, player.y) > 1.15) return false;
        if (g > -0.6) for (const c of COLLIDERS) if (Math.abs(x - c.x) < 6 && Math.abs(z - c.z) < 6 && Math.hypot(x - c.x, z - c.z) < c.r + 0.35) return false;
        if (myBoat && !myBoat.on && Math.hypot(x - myBoat.x, z - myBoat.z) < 1.4) return false;
        return Math.abs(x) < 340 && Math.abs(z) < 340;
      };
      if (ok(nx, nz)) { player.x = nx; player.z = nz; } else if (ok(nx, player.z)) player.x = nx; else if (ok(player.x, nz)) player.z = nz;
      const tr = Math.atan2(dx, dz); let d = tr - player.ry; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; player.ry += d * Math.min(1, dt * 12);
      player.walk += dt * sp * 1.6;
    } else player.walk = lerp(player.walk, Math.round(player.walk / Math.PI) * Math.PI, dt * 8);
    // hauteur : saut, gravité, nage
    const g = groundY(player.x, player.z);
    const nage = g < -0.95 && !onDock(player.x, player.z);
    if (nage && player.y < 0.4) {
      if (!player.swim && F.st !== 'idle') annulerPeche();
      player.swim = true; player.air = false; player.vy = 0;
      player.y = lerp(player.y, waveY(player.x, player.z, performance.now() / 1000) - 1.25, Math.min(1, dt * 6));
    } else {
      player.swim = false;
      player.vy -= 24 * dt; player.y += player.vy * dt;
      if (player.y <= g) { player.y = g; player.vy = 0; player.air = false; }
      else if (player.y - g > 0.35) player.air = true;
      else if (player.vy <= 0) { player.y = lerp(player.y, g, Math.min(1, dt * 18)); if (player.y - g < 0.05) { player.air = false; player.vy = 0; } }
    }
  }
  // bras/canne
  let a = -0.45, rt = 0.55;
  if (F.st === 'charge') { a = -2.7; rt = -0.5 - F.power * 0.4; }
  else if (F.st === 'vol' || F.st === 'attente') { a = -1.0; rt = 0.95; }
  else if (F.st === 'touche' || F.st === 'combat') { a = -1.0; rt = 0.55 + Math.sin(performance.now() / 60) * 0.06 + (holdInput ? -0.25 : 0); }
  player.armA = lerp(player.armA, a, Math.min(1, dt * (F.st === 'vol' ? 20 : 9))); player.rodT = lerp(player.rodT, rt, Math.min(1, dt * (F.st === 'vol' ? 20 : 9)));
  // interactions proches
  npcProche = null; let best = 3.4;
  if (myBoat && myBoat.on) npcProche = { nom: '⛵ Descendre du bateau', act: descendreBateau };
  else {
    if (myBoat && Math.hypot(player.x - myBoat.x, player.z - myBoat.z) < 5.5) { npcProche = { nom: '⛵ Monter dans le bateau', act: monterBateau }; best = 0; }
    for (const n of NPCS) { const d = Math.hypot(player.x - n.ix, player.z - n.iz); if (d < best) { best = d; npcProche = n; } }
  }
  const pr = $('prompt');
  if (npcProche && !panelOpen) { pr.classList.remove('hide'); pr.textContent = (isTouch ? 'Touche E' : 'Appuie sur E') + ' : ' + npcProche.nom; } else pr.classList.add('hide');
  $('zone').textContent = 'Zone : ' + NOM_ZONE[F.st !== 'idle' && F.to ? zoneAt(F.to[0], F.to[2]) : zoneAt(player.x + Math.sin(player.ry) * 10, player.z + Math.cos(player.ry) * 10)];
}

// =====================================================================
//  DESSIN
// =====================================================================
function drawChar(c, t) {
  const sw = c.moving ? Math.sin(c.walk) * (c.swim ? 0.4 : 0.7) : 0;
  const yb = c.seated ? -0.5 : 0;
  const M = M4.mul(M4.T(c.x, c.y + yb, c.z), M4.Ry(c.ry));
  const legA = c.seated ? -1.45 : c.air ? 0.5 : 0;
  draw(CH.leg, M4.chain(M, M4.T(-0.15, 0.9, 0), M4.Rx(sw + legA)));
  draw(CH.leg, M4.chain(M, M4.T(0.15, 0.9, 0), M4.Rx(-sw + (c.air ? -0.5 : legA))));
  const bob = c.moving ? Math.abs(Math.sin(c.walk)) * 0.05 : Math.sin(t * 2 + (c.ph || 0)) * 0.012;
  const MBb = M4.chain(M4.T(c.x, c.y + bob + yb, c.z), M4.Ry(c.ry));
  draw(CH.body, MBb, { tint: c.shirt });
  draw(CH.head, MBb); draw(CH.hat, MBb, { tint: c.hat });
  const swimA = c.swim ? -2.6 + Math.sin(c.walk * 0.8) * 0.9 : 0;
  draw(CH.arm, M4.chain(MBb, M4.T(-0.47, 1.65, 0), M4.Rx(c.swim ? swimA : c.air ? -2.4 : -sw * 0.8)), { tint: c.shirt });
  if (c.swim) { draw(CH.arm, M4.chain(MBb, M4.T(0.47, 1.65, 0), M4.Rx(-2.6 - Math.sin(c.walk * 0.8) * 0.9)), { tint: c.shirt }); return null; }
  const aa = c.rod ? c.armA : c.air ? -2.4 : sw * 0.8;
  const MA = M4.chain(MBb, M4.T(0.47, 1.65, 0), M4.Rx(aa));
  draw(CH.arm, MA, { tint: c.shirt });
  if (c.rod) {
    const MR = M4.chain(MA, M4.T(0, -0.68, 0.05), M4.Rx(c.rodT - aa));
    draw(CH.rod, MR, { tint: c.rodCol });
    return M4.pt(MR, 0, 2.5, 0);
  }
  return null;
}
const lignes = dynMesh(), pluie = dynMesh();
const pluieGouttes = []; for (let i = 0; i < 500; i++) pluieGouttes.push([Math.random() * 60 - 30, Math.random() * 30, Math.random() * 60 - 30]);
let envCache = {};
function environnement(h, t) {
  // soleil
  const ang = (h - 6) / 12 * Math.PI; const sy = Math.sin(ang), sxz = Math.cos(ang);
  const sunDir = [sxz * 0.75, sy, 0.45]; const sl = Math.hypot(...sunDir); sunDir[0] /= sl; sunDir[1] /= sl; sunDir[2] /= sl;
  const jour = clamp(sy * 3 + 0.3, 0, 1);
  const couchant = clamp(1 - Math.abs(sy) * 4, 0, 1) * (sy > -0.2 ? 1 : 0);
  let ciel = mixc(hex('#0a1430'), hex('#7cc8f2'), jour); ciel = mixc(ciel, hex('#ff9a5a'), couchant * 0.45);
  let sunCol = mixc([0.18, 0.22, 0.38], [1.0, 0.96, 0.86], jour); sunCol = mixc(sunCol, [1, 0.6, 0.35], couchant * 0.5);
  let amb = mixc([0.16, 0.2, 0.36], [0.5, 0.53, 0.58], jour);
  let fogN = 90, fogF = 260;
  const lightDir = jour > 0.15 ? sunDir : [-sunDir[0], Math.max(0.3, -sunDir[1]), -sunDir[2]];
  if (meteo === 'nuageux') { ciel = mixc(ciel, [0.55, 0.6, 0.66].map(v => v * (0.3 + jour * 0.7)), 0.55); sunCol = sunCol.map(v => v * 0.6); amb = amb.map(v => v * 1.05); }
  if (meteo === 'pluie') { ciel = mixc(ciel, [0.36, 0.4, 0.46].map(v => v * (0.3 + jour * 0.7)), 0.75); sunCol = sunCol.map(v => v * 0.4); fogN = 40; fogF = 160; }
  if (meteo === 'brouillard') { ciel = mixc(ciel, [0.72, 0.76, 0.8].map(v => v * (0.25 + jour * 0.75)), 0.8); sunCol = sunCol.map(v => v * 0.55); fogN = 6; fogF = 55; }
  // transitions douces
  const E = envCache; const k = 0.03;
  E.ciel = E.ciel ? mixc(E.ciel, ciel, k) : ciel; E.sunCol = E.sunCol ? mixc(E.sunCol, sunCol, k) : sunCol; E.amb = E.amb ? mixc(E.amb, amb, k) : amb;
  E.fogN = E.fogN ? lerp(E.fogN, fogN, k) : fogN; E.fogF = E.fogF ? lerp(E.fogF, fogF, k) : fogF;
  E.sunDir = sunDir; E.light = lightDir; E.jour = jour;
  return E;
}
let lastT = performance.now();
function frame() {
  requestAnimationFrame(frame);
  const now = performance.now(); let dt = Math.min(0.05, (now - lastT) / 1000); lastT = now; const t = now / 1000;
  if (ME) { majJoueur(dt); majPeche(dt, t); }
  // taille
  const dpr = Math.min(window.devicePixelRatio || 1, 2); const w = Math.floor(innerWidth * dpr), h = Math.floor(innerHeight * dpr);
  if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
  SW = innerWidth; SH = innerHeight;
  gl.viewport(0, 0, w, h);
  // caméra
  const tx = player.x, ty = player.y + 1.6, tz = player.z;
  let cx = tx + Math.sin(cam.yaw) * Math.cos(cam.pitch) * cam.dist, cy = ty + Math.sin(cam.pitch) * cam.dist, cz = tz + Math.cos(cam.yaw) * Math.cos(cam.pitch) * cam.dist;
  cy = Math.max(cy, groundY(cx, cz) + 0.6, 0.6);
  const P = M4.persp(1.0, w / h, 0.1, 700); const V = M4.look([cx, cy, cz], [tx, ty, tz], [0, 1, 0]); VP = M4.mul(P, V);
  const hr = heureNow(); const E = environnement(hr, t);
  gl.clearColor(E.ciel[0], E.ciel[1], E.ciel[2], 1); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.uniformMatrix4fv(U.vp, false, VP); gl.uniform1f(U.t, t);
  gl.uniform3fv(U.sunDir, E.light); gl.uniform3fv(U.sunCol, E.sunCol); gl.uniform3fv(U.amb, E.amb); gl.uniform3fv(U.fogCol, E.ciel); gl.uniform3fv(U.cam, [cx, cy, cz]);
  gl.uniform1f(U.fogN, E.fogN); gl.uniform1f(U.fogF, E.fogF);
  // ciel
  gl.depthMask(false);
  if (E.jour < 0.6 && meteo !== 'pluie' && meteo !== 'brouillard') { const a = 1 - E.jour / 0.6; draw(W.etoiles, M4.chain(M4.T(cx, 0, cz), M4.Ry(t * 0.01)), { unlit: 1, nofog: 1, ps: 2 * dpr, tint: [a, a, a] }); }
  const sd = E.sunDir;
  if (sd[1] > -0.15 && meteo !== 'brouillard') draw(W.soleil, M4.chain(M4.T(cx + sd[0] * 500, cy + sd[1] * 500, cz + sd[2] * 500), M4.S(28)), { unlit: 1, nofog: 1, tint: meteo === 'pluie' ? [0.6, 0.6, 0.6] : ONE });
  if (sd[1] < 0.15 && meteo !== 'brouillard') draw(W.lune, M4.chain(M4.T(cx - sd[0] * 500, cy - sd[1] * 500, cz - sd[2] * 500), M4.S(18)), { unlit: 1, nofog: 1 });
  gl.depthMask(true);
  // monde
  draw(W.fond, M4.T(player.x, 0, player.z));
  draw(W.terre);
  const nuit = 1 - E.jour; draw(W.glow, IDM, { unlit: 1, tint: mixc([0.85, 0.85, 0.8], [1.25, 1.15, 0.8], nuit) });
  const cc = mixc([0.3, 0.3, 0.32], [1.05, 1.05, 1.08], E.jour); draw(W.nuages, M4.T((t * 0.6) % 60 - 30, 0, 0), { tint: meteo === 'pluie' ? cc.map(v => v * 0.6) : cc, unlit: 1 });
  // PNJ
  for (const n of NPCS) { if (Math.abs(n.x - player.x) > 110 || Math.abs(n.z - player.z) > 110) continue; const g = n.g === undefined ? (n.g = H(n.x, n.z)) : n.g; drawChar({ x: n.x, y: g, z: n.z, ry: n.ry, moving: false, walk: 0, shirt: n.shirt, hat: n.hat, ph: n.x }, t); placeLabel('npc_' + n.id, n.nom, n.x, g + 3.0, n.z, 'npc', 30); }
  // noms des îles au loin
  for (const I of ILES) { const d = Math.hypot(I.x - player.x, I.z - player.z); if (d > 55) placeLabel('ile_' + I.id, I.nom + ' • ' + Math.round(d) + ' m', I.x, 24, I.z, 'ile', 480); }
  if (Math.hypot(player.x, player.z) > 80) placeLabel('ile_depart', '🏝️ Île de Départ • ' + Math.round(Math.hypot(player.x, player.z)) + ' m', 0, 22, 0, 'ile', 480);
  // bateaux
  const drawBoat = (bt) => { const bi = BOAT_INFO[bt.t]; if (!bi || !BOATS[bt.t]) return; draw(BOATS[bt.t], M4.chain(M4.T(bt.x, waveY(bt.x, bt.z, t) - 0.1, bt.z), M4.Ry(bt.ry), M4.Rz(Math.sin(t * 1.3 + bt.x) * 0.035), M4.Rx(Math.sin(t * 1.1) * 0.025 - (bt.v || 0) * 0.004))); };
  if (myBoat) drawBoat(myBoat);
  // autres joueurs
  const L = [], LC = [];
  const lc = [0.95, 0.95, 0.95];
  const ligne = (tip, b) => { if (!tip || !b) return; const mx = (tip[0] + b[0]) / 2, mz = (tip[2] + b[2]) / 2, my = Math.min(tip[1], b[1]) + (Math.max(tip[1], b[1]) - Math.min(tip[1], b[1])) * 0.3; const pts = [tip, [mx, my, mz], b]; for (let i = 0; i < 2; i++) { L.push(...pts[i], ...pts[i + 1]); LC.push(...lc, ...lc); } };
  for (const nom in autres) {
    const o = autres[nom];
    o.x = lerp(o.x, o.tx, Math.min(1, dt * 10)); o.z = lerp(o.z, o.tz, Math.min(1, dt * 10)); o.y = lerp(o.y, o.ty, Math.min(1, dt * 10));
    let d = o.try - o.ry; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; o.ry += d * Math.min(1, dt * 10);
    o.moving = (Math.hypot(o.tx - o.x, o.tz - o.z) > 0.05 || o.a === 'm' || o.a === 's') && !(o.bt && o.bt.on); if (o.moving) o.walk = (o.walk || 0) + dt * 10;
    const peche = o.a === 'p' || o.a === 'c';
    o.armA = lerp(o.armA || -0.45, peche ? -1.0 : o.a === 'ch' ? -2.7 : -0.45, dt * 9); o.rodT = lerp(o.rodT || 0.55, peche ? 0.9 : o.a === 'ch' ? -0.6 : 0.55, dt * 9);
    if (o.bt) { o.bx = lerp(o.bx === undefined ? o.bt.x : o.bx, o.bt.x, Math.min(1, dt * 10)); o.bz = lerp(o.bz === undefined ? o.bt.z : o.bz, o.bt.z, Math.min(1, dt * 10)); drawBoat({ t: o.bt.t, x: o.bx, z: o.bz, ry: o.bt.ry }); }
    const swim = o.a === 's';
    const tip = drawChar({ x: o.x, y: o.y, z: o.z, ry: o.ry, moving: o.moving, walk: o.walk, shirt: o.shirt, hat: o.hat, rod: o.rod !== false && !swim, seated: !!(o.bt && o.bt.on), swim, armA: o.armA, rodT: o.rodT, rodCol: hex((CMAP[o.canne] || CMAP.bambou).coul) }, t);
    if (peche && o.b) { const b = [o.b[0], waveY(o.b[0], o.b[2], t), o.b[2]]; draw(CH.bob, M4.T(b[0], b[1], b[2])); ligne(tip, b); }
    placeLabel('p_' + nom, nom, o.x, o.y + 2.9, o.z, '', 40);
  }
  // moi
  if (ME) {
    const tip = drawChar({ x: player.x, y: player.y, z: player.z, ry: player.ry, moving: player.moving || player.swim, walk: player.walk + (player.swim ? t * 4 : 0), shirt: MY.shirt, hat: MY.hat, rod: player.rodOut && !player.swim, seated: !!(myBoat && myBoat.on), swim: player.swim, air: player.air, armA: player.armA, rodT: player.rodT, rodCol: hex(CMAP[ME.canne].coul) }, t);
    F.tip = tip;
    if (F.st === 'vol' || F.st === 'attente' || F.st === 'touche' || F.st === 'combat') {
      draw(CH.bob, M4.T(F.bob[0], F.bob[1], F.bob[2]));
      if (F.st === 'vol') { L.push(...tip, ...F.bob); LC.push(...lc, ...lc); } else ligne(tip, F.bob);
    }
    if (F.catchShow) {
      const cs = F.catchShow, s = Math.min(1, cs.t * 4) * Math.min(1.3, 0.5 + cs.big * 0.35);
      draw(fishMesh(cs.id), M4.chain(M4.T(player.x, player.y + 3.0 + Math.sin(cs.t * 3) * 0.1, player.z), M4.Ry(cs.t * 1.5), M4.Rz(Math.sin(cs.t * 8) * 0.15), M4.S(s)));
    }
  }
  majDyn(lignes, L, LC, gl.LINES); draw(lignes, IDM, { unlit: 1 });
  // excl (!)
  const ex = label('excl', '!', 'excl');
  if (F.st === 'touche') { const p = proj(F.bob[0], F.bob[1] + 1.2, F.bob[2]); if (p) { ex.className = 'excl'; ex.style.display = ''; ex.style.left = p[0] + 'px'; ex.style.top = p[1] + 'px'; } } else ex.style.display = 'none';
  // eau
  gl.enable(gl.BLEND); draw(W.eau, M4.T(Math.round(player.x / 4) * 4, 0, Math.round(player.z / 4) * 4), { wave: 1, alpha: 0.85 });
  // pluie
  if (meteo === 'pluie') {
    const P2 = [], C2 = []; const pc = [0.75, 0.8, 0.9];
    for (const g of pluieGouttes) { g[1] -= dt * 28; if (g[1] < -2) { g[1] = 28; g[0] = Math.random() * 60 - 30; g[2] = Math.random() * 60 - 30; } const x = player.x + g[0], z = player.z + g[2]; P2.push(x, g[1], z, x + 0.12, g[1] + 0.9, z); C2.push(...pc, ...pc); }
    majDyn(pluie, P2, C2, gl.LINES); draw(pluie, IDM, { unlit: 1, alpha: 0.5 });
  }
  gl.disable(gl.BLEND);
  // HUD heure
  const hh = Math.floor(hr), mm = Math.floor((hr - hh) * 60);
  $('heure').textContent = (estJour(hr) ? '☀️ ' : '🌙 ') + String(hh).padStart(2, '0') + ':' + String(mm).padStart(2, '0');
  $('meteo').textContent = ICON_METEO[meteo] || meteo;
  for (const k in labelEls) { if (!labelEls[k]._used && k !== 'excl') labelEls[k].style.display = 'none'; labelEls[k]._used = false; }
}
let BOATS = {};
const BOAT_INFO = { barque: { len: 4.4, deck: 0.45 }, moteur: { len: 6, deck: 0.7 }, vedette: { len: 6.5, deck: 0.65 }, yacht: { len: 11, deck: 1.3 } };
function buildBoats() {
  const out = {};
  { // barque
    const b = new B(); const c = hex('#9a6a3e'), c2 = hex('#6e4826');
    b.box(0, 0.25, 0, 1.7, 0.5, 4.0, c, 0, true); b.box(0, 0.55, 0, 1.8, 0.1, 4.1, c2, 0, true); b.box(0, 0.42, 0, 1.4, 0.06, 3.6, hex('#b9875a'));
    b.box(0, 0.25, 2.2, 1.0, 0.45, 0.5, c, 0, true); b.box(0, 0.6, 0.2, 1.5, 0.1, 0.4, c2); b.box(0, 0.6, -1.2, 1.5, 0.1, 0.4, c2);
    for (const sx of [-1, 1]) b.box(sx * 1.2, 0.5, 0.2, 0.08, 0.08, 2.4, c2, sx * 0.3);
    out.barque = b.mesh();
  }
  { // bateau à moteur
    const b = new B(); const c = hex('#2b9be0'), w = hex('#f2f2ee');
    b.box(0, 0.3, 0, 2.3, 0.7, 5.6, w, 0, true); b.box(0, 0.05, 0, 2.2, 0.3, 5.5, c, 0, true); b.box(0, 0.3, 3.0, 1.4, 0.6, 0.8, w, 0, true); b.box(0, 0.3, 3.4, 0.6, 0.5, 0.5, w, 0, true);
    b.box(0, 0.68, 0, 2.0, 0.06, 5.2, hex('#c8a46a')); b.box(0, 1.25, -0.7, 1.7, 1.1, 1.6, w, 0, true); b.box(0, 1.85, -0.7, 1.9, 0.12, 1.9, c, 0, true); b.box(0, 1.35, 0.12, 1.5, 0.5, 0.05, hex('#88c8f0'));
    b.box(0, 0.5, -2.95, 0.5, 0.8, 0.5, hex('#333')); out.moteur = b.mesh();
  }
  { // vedette
    const b = new B(); const c = hex('#e5484d'), w = hex('#f2f2ee');
    b.box(0, 0.3, -0.3, 2.2, 0.6, 5.2, w, 0, true); b.box(0, 0.05, -0.3, 2.1, 0.3, 5.1, c, 0, true);
    b.tri([-1.1, 0.6, 2.3], [1.1, 0.6, 2.3], [0, 0.6, 3.8], w, true); b.tri([-1.1, 0.0, 2.3], [0, 0.0, 3.8], [1.1, 0.0, 2.3], c);
    b.tri([-1.1, 0.0, 2.3], [-1.1, 0.6, 2.3], [0, 0.6, 3.8], c); b.tri([1.1, 0.6, 2.3], [1.1, 0.0, 2.3], [0, 0.6, 3.8], c);
    b.box(0, 0.62, -0.3, 1.9, 0.06, 4.8, hex('#d8c8a8')); b.box(0, 1.0, 1.0, 1.8, 0.6, 0.06, hex('#88c8f0')); b.box(0, 0.8, -0.6, 1.2, 0.4, 0.8, c, 0, true);
    b.box(0, 0.6, -2.95, 0.7, 0.9, 0.6, hex('#222')); out.vedette = b.mesh();
  }
  { // yacht
    const b = new B(); const w = hex('#f7f7f4'), bl = hex('#1f3f6a'), g = hex('#c8a46a');
    b.box(0, 0.5, 0, 3.6, 1.2, 10, w, 0, true); b.box(0, 0.0, 0, 3.4, 0.4, 9.8, bl, 0, true); b.box(0, 0.5, 5.4, 2.4, 1.1, 1.2, w, 0, true); b.box(0, 0.5, 6.1, 1.2, 1.0, 0.8, w, 0, true);
    b.box(0, 1.12, 0, 3.3, 0.06, 9.6, g); b.box(0, 1.8, -1.2, 2.8, 1.3, 4.5, w, 0, true); b.box(0, 1.95, -1.2, 2.85, 0.35, 4.55, hex('#2a3a50'));
    b.box(0, 2.6, -1.6, 2.2, 0.9, 2.8, w, 0, true); b.box(0, 2.7, -1.6, 2.25, 0.3, 2.85, hex('#2a3a50')); b.cyl(0, 3.0, -2.2, 0.06, 0.06, 2, 5, hex('#999'));
    for (const sx of [-1, 1]) b.box(sx * 1.75, 1.45, 2.6, 0.06, 0.5, 5, hex('#bbb'));
    out.yacht = b.mesh();
  }
  return out;
}
// ---------- synchro ----------
let syncEnCours = false;
function setMonde(m) { if (!m) return; worldH = m.h; worldT0 = performance.now(); jourMs = m.jourMs || jourMs; if (m.meteo) meteo = m.meteo; }
function couleurNom(nom) { let h = 0; for (const c of nom) h = (h * 31 + c.charCodeAt(0)) >>> 0; const r = mulberry(h); const pal = ['#e5484d', '#2b9be0', '#3fbf55', '#f2b51d', '#8a5cd8', '#ff8a20', '#20c0b0', '#ff5aa0']; return { shirt: hex(pal[Math.floor(r() * pal.length)]), hat: hex(['#f0d080', '#ffffff', '#3a3a3a', '#d8423a', '#2b5f9e'][Math.floor(r() * 5)]) }; }
let MY = { shirt: hex('#2b9be0'), hat: hex('#f0d080') };
async function sync() {
  if (!ME || syncEnCours) return; syncEnCours = true;
  const a = player.swim ? 's' : player.moving ? 'm' : F.st === 'charge' ? 'ch' : (F.st === 'attente' || F.st === 'touche') ? 'p' : F.st === 'combat' ? 'c' : '';
  const bt = myBoat ? { t: myBoat.t, x: myBoat.x, z: myBoat.z, ry: myBoat.ry, on: myBoat.on } : null;
  const r = await api('/api/sync', { x: player.x, y: player.y, z: player.z, ry: player.ry, a, rod: player.rodOut, bt, b: (F.st === 'attente' || F.st === 'touche' || F.st === 'combat') ? F.bob : null, depuis: annSince });
  syncEnCours = false;
  if (!r || r.err) return;
  const ancienneMeteo = meteo;
  setMonde(r.monde);
  for (const an of r.annonces || []) { toast(an.txt, 4500); annSince = Math.max(annSince, an.t); }
  if (r.now && annSince < r.now - 60000) annSince = r.now - 60000;
  const vus = {};
  for (const o of r.autres) {
    vus[o.nom] = 1; let a2 = autres[o.nom];
    if (!a2) { a2 = autres[o.nom] = Object.assign({ x: o.x, y: o.y, z: o.z, ry: o.ry }, couleurNom(o.nom)); }
    a2.tx = o.x; a2.ty = o.y; a2.tz = o.z; a2.try = o.ry; a2.a = o.a; a2.b = o.b; a2.canne = o.canne; a2.bt = o.bt; a2.rod = o.rod;
  }
  for (const k in autres) if (!vus[k]) delete autres[k];
}

// =====================================================================
//  CONNEXION + DÉMARRAGE
// =====================================================================
async function entrer(r) {
  if (r.err) { $('lmsg').textContent = r.err; return; }
  TOKEN = r.token; localStorage.setItem('fs_token', TOKEN); demarrer(r.etat);
}
$('bJouer').onclick = async () => entrer(await api('/api/connexion', { nom: $('lnom').value, pass: $('lpass').value }));
$('bCreer').onclick = async () => entrer(await api('/api/inscription', { nom: $('lnom').value, pass: $('lpass').value }));
$('lpass').addEventListener('keydown', e => { if (e.key === 'Enter') $('bJouer').click(); });
let syncTimer = null;
function demarrer(etat) {
  setEtat(etat); MY = couleurNom(ME.nom);
  $('login').classList.add('hide'); $('jeu').classList.remove('hide');
  player.x = 29; player.z = 0.5; player.y = groundY(29, 0.5); player.ry = Math.PI / 2; cam.yaw = -Math.PI / 2;
  if (!syncTimer) syncTimer = setInterval(sync, 220);
  if (!localStorage.getItem('fs_vu')) { localStorage.setItem('fs_vu', 1); setTimeout(() => toast('👋 Bienvenue ' + ME.nom + ' ! Va au bout du ponton et maintiens le clic pour lancer ta ligne 🎣', 6500), 500); }
}
(async function init() {
  try {
    W = buildWorld(); CH = buildChar(); BOATS = buildBoats();
    const d = await api('/api/data');
    DATA = d; PMAP = Object.fromEntries(d.POISSONS.map(p => [p.id, p])); CMAP = Object.fromEntries(d.CANNES.map(c => [c.id, c])); AMAP = Object.fromEntries(d.APPATS.map(a => [a.id, a])); BMAPC = Object.fromEntries(d.BATEAUX.map(a => [a.id, a])); EMAPC = Object.fromEntries(d.ENCHANTS.map(a => [a.id, a]));
    setMonde(d.monde);
    $('loading').classList.add('hide');
    requestAnimationFrame(frame);
    if (TOKEN) { const r = await api('/api/moi', {}); if (r.etat) return demarrer(r.etat); }
    $('login').classList.remove('hide');
  } catch (e) { $('loading').textContent = 'Erreur : ' + e.message; console.error(e); }
})();
</script>
</body>
</html>
`; }
