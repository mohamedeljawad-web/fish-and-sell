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
  { id: 'kraken', nom: 'Le Petit Kraken', r: 6, zone: 'recif', moment: 'tous', meteo: 'pluie', kg: [300, 900], prix: 28, coul: '#602040', taille: 3.0 },
  // ÎLE PRÉHISTORIQUE
  { id: 'trilobite', nom: 'Trilobite Géant', r: 0, zone: 'prehisto', moment: 'tous', meteo: null, kg: [0.5, 3], prix: 9, coul: '#8a7050', taille: 0.7 },
  { id: 'fossile', nom: 'Poisson-Fossile', r: 0, zone: 'prehisto', moment: 'tous', meteo: null, kg: [1, 5], prix: 5, coul: '#a89a80', taille: 0.9 },
  { id: 'ammonite', nom: 'Ammonite Spirale', r: 1, zone: 'prehisto', moment: 'tous', meteo: null, kg: [1, 6], prix: 9, coul: '#c8a070', taille: 0.8 },
  { id: 'coelacanthe', nom: 'Cœlacanthe Ancien', r: 2, zone: 'prehisto', moment: 'tous', meteo: null, kg: [20, 80], prix: 2.5, coul: '#3a4a7a', taille: 1.8 },
  { id: 'anomalo', nom: 'Anomalocaris', r: 3, zone: 'prehisto', moment: 'nuit', meteo: null, kg: [5, 20], prix: 30, coul: '#c05a3a', taille: 1.5 },
  { id: 'dunkleo', nom: 'Dunkléostée Cuirassé', r: 4, zone: 'prehisto', moment: 'tous', meteo: null, kg: [300, 900], prix: 2, coul: '#5a5a50', taille: 2.8 },
  { id: 'plesio', nom: 'Bébé Plésiosaure', r: 5, zone: 'prehisto', moment: 'tous', meteo: 'pluie', kg: [80, 250], prix: 25, coul: '#4a7a6a', taille: 2.6 },
  { id: 'megalodon', nom: 'Mégalodon', r: 6, zone: 'mega', moment: 'tous', meteo: null, kg: [2000, 6000], prix: 8, coul: '#59646f', taille: 4.0, evenement: 'mega' },
  { id: 'megaancien', nom: 'Mégalodon Ancien', r: 6, zone: 'mega', moment: 'tous', meteo: null, kg: [5000, 12000], prix: 10, coul: '#2a3f8a', taille: 4.6, evenement: 'mega' },
  { id: 'megafantome', nom: 'Mégalodon Fantôme', r: 6, zone: 'mega', moment: 'tous', meteo: null, kg: [3000, 9000], prix: 30, coul: '#cfeff8', taille: 4.3, evenement: 'mega' },
  // ROCHER DES ABYSSES
  { id: 'grenadier', nom: 'Grenadier des Profondeurs', r: 0, zone: 'abysses', moment: 'tous', meteo: null, kg: [1, 4], prix: 7, coul: '#4a4a5a', taille: 0.9 },
  { id: 'isopode', nom: 'Isopode Géant', r: 1, zone: 'abysses', moment: 'tous', meteo: null, kg: [1, 3], prix: 18, coul: '#b0a090', taille: 0.8 },
  { id: 'vipere', nom: 'Poisson-Vipère', r: 2, zone: 'abysses', moment: 'nuit', meteo: null, kg: [0.3, 1.5], prix: 140, coul: '#2a2a3a', taille: 0.8 },
  { id: 'baudroie', nom: 'Baudroie Lumineuse', r: 3, zone: 'abysses', moment: 'tous', meteo: null, kg: [5, 25], prix: 27, coul: '#3a3040', taille: 1.3 },
  { id: 'lutin', nom: 'Requin Lutin', r: 4, zone: 'abysses', moment: 'nuit', meteo: null, kg: [100, 300], prix: 6, coul: '#d8a8b0', taille: 2.4 },
  // GOUFFRE DU KRAKEN (débloqué par les épreuves)
  { id: 'crevetteab', nom: 'Crevette Abyssale', r: 0, zone: 'gouffre', moment: 'tous', meteo: null, kg: [0.05, 0.3], prix: 120, coul: '#e05a5a', taille: 0.4 },
  { id: 'ombre', nom: 'Poisson-Ombre', r: 2, zone: 'gouffre', moment: 'tous', meteo: null, kg: [2, 8], prix: 30, coul: '#1a1a2a', taille: 1.1 },
  { id: 'anguillegouffre', nom: 'Anguille du Gouffre', r: 3, zone: 'gouffre', moment: 'tous', meteo: null, kg: [10, 30], prix: 22, coul: '#3a1a4a', taille: 1.8 },
  { id: 'colossal', nom: 'Calmar Colossal', r: 5, zone: 'gouffre', moment: 'tous', meteo: null, kg: [200, 500], prix: 18, coul: '#a03040', taille: 3.0 },
  { id: 'grandkraken', nom: 'Le Kraken', r: 6, zone: 'gouffre', moment: 'tous', meteo: null, kg: [5000, 12000], prix: 6, coul: '#4a1a5a', taille: 4.5, evenement: 'kraken' },
  { id: 'krakenancien', nom: 'Kraken Ancien', r: 6, zone: 'gouffre', moment: 'tous', meteo: null, kg: [15000, 30000], prix: 9, coul: '#2a4a2a', taille: 5.0, evenement: 'kraken' },
  // CASIERS (crustacés)
  { id: 'crabevert', nom: 'Crabe Vert', r: 0, zone: 'casier', moment: 'tous', meteo: null, kg: [0.2, 1], prix: 25, coul: '#5a8a3a', taille: 0.6 },
  { id: 'crevettetigre', nom: 'Crevette Tigrée', r: 0, zone: 'casier', moment: 'tous', meteo: null, kg: [0.05, 0.2], prix: 90, coul: '#e8904a', taille: 0.4 },
  { id: 'ecrevisse', nom: 'Écrevisse Rouge', r: 1, zone: 'casier', moment: 'tous', meteo: null, kg: [0.1, 0.5], prix: 90, coul: '#c83a2a', taille: 0.5 },
  { id: 'homardbleu', nom: 'Homard Bleu', r: 2, zone: 'casier', moment: 'tous', meteo: null, kg: [1, 5], prix: 45, coul: '#2a5ac8', taille: 0.9 },
  { id: 'araignee', nom: 'Crabe Araignée', r: 3, zone: 'casier', moment: 'tous', meteo: null, kg: [3, 12], prix: 40, coul: '#c87a4a', taille: 1.2 },
  { id: 'langouste', nom: 'Langouste Royale', r: 4, zone: 'casier', moment: 'tous', meteo: null, kg: [2, 8], prix: 180, coul: '#d8502a', taille: 1.0 },
  { id: 'crabeancien', nom: 'Crabe Doré Ancien', r: 5, zone: 'casier', moment: 'tous', meteo: null, kg: [5, 15], prix: 300, coul: '#ffc83a', taille: 1.2 },
  { id: 'homardfantome', nom: 'Homard Fantôme', r: 6, zone: 'casier', moment: 'nuit', meteo: null, kg: [5, 20], prix: 1200, coul: '#c8f0ff', taille: 1.3 },
  // POISSONS ERRANTS (harpon, sous l'eau)
  { id: 'thonerrant', nom: 'Thon Errant', r: 1, zone: 'errant', moment: 'tous', meteo: null, kg: [5, 20], prix: 3, coul: '#3a5a9a', taille: 1.2 },
  { id: 'merouvagabond', nom: 'Mérou Vagabond', r: 2, zone: 'errant', moment: 'tous', meteo: null, kg: [10, 40], prix: 4, coul: '#8a6a4a', taille: 1.5 },
  { id: 'espadonnomade', nom: 'Espadon Nomade', r: 3, zone: 'errant', moment: 'tous', meteo: null, kg: [30, 90], prix: 6, coul: '#5a6a9a', taille: 2.0 },
  { id: 'raiespectrale', nom: 'Raie Spectrale', r: 4, zone: 'errant', moment: 'tous', meteo: null, kg: [20, 70], prix: 20, coul: '#a0c0ff', taille: 1.8 },
  { id: 'baleineerrante', nom: 'Baleine Voyageuse', r: 5, zone: 'errant', moment: 'tous', meteo: null, kg: [800, 2000], prix: 3, coul: '#3a4a6a', taille: 3.2 }
];
const OBJETS = [
  { id: 'casier', nom: 'Casier à crabes', prix: 60, desc: 'Pose-le dans l\'eau (touche 7), reviens dans 3 minutes et relève-le pour attraper des crustacés.', stack: true },
  { id: 'planeur', nom: 'Planeur', prix: 3000, desc: 'Saute d\'un endroit haut et MAINTIENS ESPACE pour planer loin (touche 8 pour le sortir).' },
  { id: 'plongee', nom: 'Équipement de plongée', prix: 2500, desc: 'Quand tu nages, appuie sur G pour plonger sous l\'eau (attention à l\'oxygène !).' },
  { id: 'harpon', nom: 'Harpon', prix: 6000, desc: 'Sous l\'eau, vise un poisson errant et clique pour le harponner.' },
  { id: 'radar', nom: 'Radar à poissons', prix: 8000, desc: 'Montre les zones de pêche autour de toi et les poissons disponibles maintenant (touche 9).' }
];
const OMAP = Object.fromEntries(OBJETS.map(o => [o.id, o]));
const QUETES_MODELES = [
  { type: 'zone', zones: ['cote', 'etang', 'large'], n: [4, 7], gain: 150, txt: z => 'Attrape {n} poissons : ' + NOMS_ZONES[z] },
  { type: 'zone', zones: ['braise', 'givre', 'marais', 'recif', 'prehisto'], n: [3, 5], gain: 600, txt: z => 'Attrape {n} poissons : ' + NOMS_ZONES[z] },
  { type: 'rarete', r: 2, n: [1, 3], gain: 400, txt: () => 'Attrape {n} poisson(s) Rare ou mieux' },
  { type: 'rarete', r: 3, n: [1, 1], gain: 1200, txt: () => 'Attrape un poisson Épique ou mieux' },
  { type: 'nuit', n: [3, 5], gain: 300, txt: () => 'Attrape {n} poissons pendant la nuit' },
  { type: 'vendre', n: [500, 3000], gain: 250, txt: () => 'Vends pour {n} $ de poissons' },
  { type: 'casier', n: [2, 4], gain: 300, txt: () => 'Relève {n} casiers à crabes' },
  { type: 'mutation', n: [1, 1], gain: 900, txt: () => 'Attrape un poisson avec une mutation ou Brillant' }
];
const NOMS_ZONES = { etang: "l'Étang", cote: 'la Côte', large: 'la pleine mer', braise: "l'Île Braise", givre: "l'Île Givre", marais: 'le Marais Brumeux', recif: 'le Récif Perdu', prehisto: "l'Île Préhistorique" };
const ZONES = ['etang', 'cote', 'large', 'braise', 'givre', 'marais', 'recif', 'prehisto', 'mega', 'abysses', 'gouffre'];
const VARIANTES = [{ id: 'scint', nom: 'Scintillant', chance: 0.015, mult: 3 }, { id: 'brillant', nom: 'Brillant', chance: 0.045, mult: 1.8 }];
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
  { id: 'etoile', nom: 'Canne Étoile', prix: 150000, niv: 22, lure: 2.1, control: 0.36, resil: 35, chance: 160, coul: '#ffe066', lieu: 'recif' },
  // cannes spéciales : pas en boutique normale
  { id: 'naufrage', nom: 'Canne du Naufragé', prix: 0, niv: 1, lure: 1.35, control: 0.27, resil: 12, chance: 35, coul: '#8a7a60', lieu: 'cachee', comment: '??? Une canne mystérieuse… personne ne sait où elle est.' },
  { id: 'megalo', nom: 'Canne Mégalodon', prix: 80000, niv: 1, lure: 1.75, control: 0.31, resil: 45, chance: 100, coul: '#7a8590', lieu: 'prehisto', condition: 'megalodon', comment: 'Seuls ceux qui ont vaincu un Mégalodon peuvent l\'acheter.' },
  { id: 'ancestrale', nom: 'Canne Ancestrale', prix: 0, niv: 1, lure: 1.9, control: 0.35, resil: 30, chance: 130, coul: '#4ad0c0', lieu: 'recompense', comment: '??? Une légende raconte qu\'un gardien la protège…' },
  { id: 'lane', nom: 'Canne de Lane', prix: 0, niv: 1, lure: 99, control: 1, resil: 100, chance: 999999, coul: '#8f8984', lieu: 'admin', instant: true, comment: '👑 La canne du Créateur. Le poisson mord tout de suite, chance infinie.' },
  { id: 'krakenrod', nom: 'Canne du Kraken', prix: 0, niv: 1, lure: 2.0, control: 0.38, resil: 50, chance: 180, coul: '#6a2a8a', lieu: 'recompense', comment: '??? On dit qu\'elle appartient à une créature des profondeurs…' }
];
const BATEAUX = [
  { id: 'barque', nom: 'Barque', prix: 600, niv: 1, vitesse: 11, virage: 1.4, desc: 'Petite barque en bois, parfaite pour commencer' },
  { id: 'moteur', nom: 'Bateau à moteur', prix: 3500, niv: 1, vitesse: 19, virage: 1.5, desc: 'Plus rapide, avec une petite cabine' },
  { id: 'vedette', nom: 'Vedette rapide', prix: 14000, niv: 1, vitesse: 30, virage: 1.8, desc: 'Fonce sur les vagues !' },
  { id: 'yacht', nom: 'Yacht de luxe', prix: 60000, niv: 1, vitesse: 26, virage: 1.1, desc: 'Grand, beau et confortable' }
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
  { id: 'brume', nom: 'Totem Brume', prix: 1500, desc: 'Fait venir le brouillard' },
  { id: 'journuit', nom: 'Totem Jour/Nuit', prix: 2500, desc: 'Le jour devient la nuit (et la nuit devient le jour). Fait venir le Mégalodon et le Kraken plus vite !' },
  { id: 'eclipse', nom: 'Totem Éclipse', prix: 9000, desc: 'À utiliser APRÈS un Totem Jour/Nuit. Une éclipse recouvre le ciel jusqu\'à ce qu\'un Mégalodon… spécial apparaisse 👻' }
];
const TMAP = Object.fromEntries(TOTEMS.map(t => [t.id, t]));

const MUTATIONS = [
  { id: 'geant', nom: 'Géant', chance: 0.02, mult: 1, poids: 3 },
  { id: 'albinos', nom: 'Albinos', chance: 0.03, mult: 1.5, poids: 1 },
  { id: 'dore', nom: 'Doré', chance: 0.01, mult: 3, poids: 1 },
  { id: 'arcenciel', nom: 'Arc-en-ciel', chance: 0.003, mult: 6, poids: 1 }
];

const SAC_MAX = 80;
// ===== CRÉATEUR / ADMINS =====
const CREATEUR = 'dylan_lane';
const CODE_HASH = '0cdacf9e5c478810f45a655641cacc19aa48af8ef5e3d68f39845f9189d07b7e';
function codeOK(code) { return crypto.createHash('sha256').update('fishandsell:' + String(code || '').trim().toUpperCase()).digest('hex') === CODE_HASH; }
function role(u) { if (!u) return ''; if (u.nom.toLowerCase() === CREATEUR && u.createurOK) return 'createur'; if (u.admin) return 'admin'; return ''; }
function banInfo(u) {
  if (!u || !u.ban) return null;
  if (u.ban.fin && Date.now() > u.ban.fin) { u.ban = null; sauver(); return null; }
  return u.ban;
}
function texteBan(b) { return b.fin ? '⛔ Tu es banni jusqu\'au ' + new Date(b.fin).toLocaleString('fr-FR', { timeZone: 'UTC' }) + ' (UTC)' + (b.raison ? ' — ' + b.raison : '') : '⛔ Tu es banni définitivement' + (b.raison ? ' — ' + b.raison : ''); }
function deconnecterTout(nom) { for (const t in DB.tokens) if (DB.tokens[t].toLowerCase() === nom.toLowerCase()) delete DB.tokens[t]; delete enLigne[nom]; delete srvDe[nom.toLowerCase()]; }
// ===== SERVEURS DE 25 JOUEURS =====
const MAX_SRV = 25;
const srvDe = {}; // nom (minuscule) -> numéro de serveur
function compteSrv(n) { let c = 0; for (const k in enLigne) if (enLigne[k].srv === n) c++; return c; }
function choisirSrv(nom, voulu) {
  const k = nom.toLowerCase();
  if (voulu && compteSrv(voulu) < MAX_SRV) return srvDe[k] = voulu;
  if (srvDe[k] && (enLigne[nom] || compteSrv(srvDe[k]) < MAX_SRV)) return srvDe[k];
  for (let n = 1; ; n++) if (compteSrv(n) < MAX_SRV) return srvDe[k] = n;
}
// ===== BOOST DE CHANCE (événement admin) =====
let boost = { mult: 1, fin: 0 };
function boostActif() { return Date.now() < boost.fin ? boost.mult : 1; }
const OFFRANDE = ['poulpe', 'murene', 'obsidienne'];
const CASIER_MS = 3 * 60 * 1000;
// ajoute une prise : sac, carnet (avec variantes), xp, quête
function ajouterPrise(u, f, zone) {
  const p = PMAP[f.id];
  u.sac.push(f);
  f._nouveau = !u.carnet[f.id];
  const c = u.carnet[f.id] || { n: 0, max: 0, b: 0, s: 0 }; c.n++; if (f.kg > c.max) c.max = f.kg;
  if (f.vari === 'brillant') c.b = (c.b || 0) + 1; if (f.vari === 'scint') c.s = (c.s || 0) + 1;
  u.carnet[f.id] = c;
  u._avant = niveauDe(u.xp); u.xp += RARETES[p.r].xp;
  const q = u.quete;
  if (q && !q.fini) {
    if (q.type === 'zone' && zone === q.zone) q.fait++;
    if (q.type === 'rarete' && p.r >= q.r) q.fait++;
    if (q.type === 'nuit' && !estJour()) q.fait++;
    if (q.type === 'mutation' && (f.mut || f.vari)) q.fait++;
    if (q.fait >= q.n) { q.fait = q.n; q.fini = true; }
  }
}
function avancerQuete(u, type, n) { const q = u.quete; if (q && !q.fini && q.type === type) { q.fait += n; if (q.fait >= q.n) { q.fait = q.n; q.fini = true; } } }
const FLAMMES = ['braise', 'givre', 'marais', 'recif'];
function verifQuetes(u) {
  const q = u.quetes;
  if (!q.gouffre && q.offrande && q.flammes.length >= 4 && q.chant) {
    q.gouffre = true; if (!u.cannes.includes('ancestrale')) u.cannes.push('ancestrale');
    annoncer('🌀 ' + u.nom + ' a réussi les 3 épreuves et ouvert le Gouffre du Kraken !');
  }
}
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
// MÉGALODON : il rôde autour de l'Île Préhistorique pendant 4 minutes, toutes les ~12 minutes
// variantes : normal 75 %, Ancien 25 %, Fantôme seulement pendant une ÉCLIPSE (Totem Jour/Nuit puis Totem Éclipse)
const PREHISTO = { x: 30, z: -360 };
const NOM_MEGA = { normal: 'MÉGALODON', ancien: 'MÉGALODON ANCIEN', fantome: 'MÉGALODON FANTÔME' };
let mega = { actif: false, x: 0, z: 0, fin: 0, prochain: Date.now() + 4 * 60000, variante: 'normal' };
let eclipse = false, dernierJourNuit = 0;
function lancerMega(variante) {
  const a = Math.random() * Math.PI * 2;
  mega = { actif: true, x: Math.round(clamp(PREHISTO.x + Math.cos(a) * 75, -395, 395)), z: Math.round(clamp(PREHISTO.z + Math.sin(a) * 75, -395, 395)), fin: Date.now() + 4 * 60000, prochain: 0, variante };
  annoncer((variante === 'fantome' ? '👻' : '🦈') + " ALERTE : le " + NOM_MEGA[variante] + " rôde près de l'Île Préhistorique ! Cherche son aileron !");
}
function majMega() {
  const t = Date.now();
  if (mega.actif && t > mega.fin) { if (mega.variante === 'fantome') eclipse = false; mega.actif = false; mega.prochain = t + 8 * 60000; annoncer("🦈 Le " + NOM_MEGA[mega.variante] + " est reparti dans les profondeurs…"); }
  if (!mega.actif && t > mega.prochain) lancerMega(eclipse ? 'fantome' : Math.random() < 0.75 ? 'normal' : 'ancien');
}
setInterval(majMega, 3000);
// KRAKEN : il sort dans le Gouffre pendant 4 minutes, toutes les ~15 minutes (99 % normal, 1 % Ancien)
let kraken = { actif: false, fin: 0, prochain: Date.now() + 6 * 60000, variante: 'normal' };
function lancerKraken(variante) {
  kraken = { actif: true, fin: Date.now() + 4 * 60000, prochain: 0, variante };
  annoncer(variante === 'ancien' ? '🐙🔥 ALERTE ULTRA RARE : le KRAKEN ANCIEN se réveille dans le Gouffre !!!' : '🐙 ALERTE : le KRAKEN sort de son Gouffre ! Ses tentacules sont visibles !');
}
function majKraken() {
  const t = Date.now();
  if (kraken.actif && t > kraken.fin) { kraken.actif = false; kraken.prochain = t + 11 * 60000; annoncer('🐙 Le ' + (kraken.variante === 'ancien' ? 'Kraken Ancien' : 'Kraken') + ' est retourné au fond du Gouffre…'); }
  if (!kraken.actif && t > kraken.prochain) lancerKraken(Math.random() < 0.01 ? 'ancien' : 'normal');
}
setInterval(majKraken, 3000);
let totemCooldown = 0;

// ---------------- SAUVEGARDE ----------------
// Si UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN sont réglés sur Render → sauvegarde PERMANENTE dans Upstash.
// Sinon → fichier local (s'efface quand Render redémarre).
const UP_URL = (process.env.UPSTASH_REDIS_REST_URL || '').replace(/\/+$/, '');
const UP_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || '';
const AVEC_BDD = !!(UP_URL && UP_TOKEN);
let DB = { users: {}, tokens: {} };
let dirty = false;
function sauver() { dirty = true; }
async function upstash(cmds) {
  const r = await fetch(UP_URL + '/pipeline', { method: 'POST', headers: { Authorization: 'Bearer ' + UP_TOKEN, 'Content-Type': 'application/json' }, body: JSON.stringify(cmds) });
  if (!r.ok) throw new Error('Upstash ' + r.status + ' ' + (await r.text()).slice(0, 200));
  return r.json();
}
const dejaSauve = { users: {}, tokens: {} }; // dernière version envoyée (pour n'envoyer que ce qui change)
async function chargerDB() {
  if (AVEC_BDD) {
    const [u, t] = await upstash([['HGETALL', 'fs:users'], ['HGETALL', 'fs:tokens']]);
    const lu = u.result || [], lt = t.result || [];
    for (let i = 0; i < lu.length; i += 2) { try { DB.users[lu[i]] = JSON.parse(lu[i + 1]); dejaSauve.users[lu[i]] = lu[i + 1]; } catch (e) { } }
    for (let i = 0; i < lt.length; i += 2) { DB.tokens[lt[i]] = lt[i + 1]; dejaSauve.tokens[lt[i]] = lt[i + 1]; }
    console.log('💾 Sauvegarde Upstash : ' + Object.keys(DB.users).length + ' comptes chargés');
  } else {
    try { DB = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); } catch (e) { }
    DB.users = DB.users || {}; DB.tokens = DB.tokens || {};
    console.log('⚠️ Pas de base de données réglée : sauvegarde dans un fichier (temporaire sur Render)');
  }
  for (const k in DB.users) { const u = DB.users[k]; u.bateaux = u.bateaux || []; u.enchants = u.enchants || {}; u.reliques = u.reliques || 0; u.quetes = u.quetes || { offrande: false, flammes: [], chant: false, gouffre: false }; u.objets = u.objets || {}; u.casiers = u.casiers || []; }
}
let enCoursSauve = false, chargementRate = false;
async function flush() {
  if (!dirty || enCoursSauve || chargementRate) return;
  dirty = false;
  if (!AVEC_BDD) { fs.writeFile(DATA_FILE + '.tmp', JSON.stringify(DB), err => { if (!err) fs.rename(DATA_FILE + '.tmp', DATA_FILE, () => { }); }); return; }
  enCoursSauve = true;
  try {
    const cmds = [], setU = [], setT = [], delU = [], delT = [], nouveauU = {}, nouveauT = {};
    for (const k in DB.users) { const { enCours, enCoursT, enCoursZone, _avant, dernierHarpon, ...propre } = DB.users[k]; const j = JSON.stringify(propre); nouveauU[k] = j; if (dejaSauve.users[k] !== j) setU.push(k, j); }
    for (const k in dejaSauve.users) if (!(k in DB.users)) delU.push(k);
    for (const t in DB.tokens) { nouveauT[t] = DB.tokens[t]; if (dejaSauve.tokens[t] !== DB.tokens[t]) setT.push(t, DB.tokens[t]); }
    for (const t in dejaSauve.tokens) if (!(t in DB.tokens)) delT.push(t);
    if (setU.length) cmds.push(['HSET', 'fs:users', ...setU]);
    if (delU.length) cmds.push(['HDEL', 'fs:users', ...delU]);
    if (setT.length) cmds.push(['HSET', 'fs:tokens', ...setT]);
    if (delT.length) cmds.push(['HDEL', 'fs:tokens', ...delT]);
    if (cmds.length) await upstash(cmds);
    dejaSauve.users = nouveauU; dejaSauve.tokens = nouveauT;
  } catch (e) { console.error('Erreur de sauvegarde :', e.message); dirty = true; }
  enCoursSauve = false;
}
setInterval(flush, AVEC_BDD ? 15000 : 3000);
// quand Render éteint ou redémarre le serveur : on sauvegarde tout de suite
for (const sig of ['SIGTERM', 'SIGINT']) process.on(sig, async () => { dirty = true; enCoursSauve = false; try { await flush(); } catch (e) { } process.exit(0); });

function hash(pass, salt) { return crypto.createHash('sha256').update(salt + ':' + pass).digest('hex'); }
function nouveauJoueur(nom, pass) {
  const salt = crypto.randomBytes(8).toString('hex');
  return {
    nom, salt, pass: hash(pass, salt), argent: 50, xp: 0, gagne: 0, prises: 0,
    cannes: ['bambou'], canne: 'bambou', appats: {}, appat: null, sac: [], carnet: {}, bateaux: [], enchants: {}, reliques: 0, quetes: { offrande: false, flammes: [], chant: false, gouffre: false }, objets: {}, casiers: [], quete: null, cree: Date.now()
  };
}
function etat(u) {
  return {
    nom: u.nom, argent: u.argent, xp: u.xp, niv: niveauDe(u.xp), xpNiv: xpPourNiveau(niveauDe(u.xp)), xpSuiv: xpPourNiveau(niveauDe(u.xp) + 1),
    cannes: u.cannes, canne: u.canne, appats: u.appats, appat: u.appat, sac: u.sac, carnet: u.carnet, prises: u.prises,
    bateaux: u.bateaux || [], enchants: u.enchants || {}, reliques: u.reliques || 0, quetes: u.quetes, prisesCanne: u.prisesCanne || {}, role: role(u), amis: u.amis || [], demandes: u.demandes || [], objets: u.objets || {}, casiers: (u.casiers || []).map(c => ({ id: c.id, x: c.x, z: c.z, pret: Date.now() - c.t >= CASIER_MS, reste: Math.max(0, CASIER_MS - (Date.now() - c.t)) })), quete: u.quete || null
  };
}

// ---------------- TIRAGE D'UN POISSON ----------------
function rnd(a, b) { return a + Math.random() * (b - a); }
function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
function tirerPoisson(u, zone, opts) {
  opts = opts || {};
  const canne = CMAP[u.canne] || CANNES[0];
  const ench = EMAP[(u.enchants || {})[u.canne]] || {};
  let chance = (canne.chance + (ench.chance || 0)) * boostActif() + (boostActif() > 1 ? 30 * boostActif() : 0);
  let ap0 = false; const ap = !opts.sansAppat && u.appat && u.appats[u.appat] > 0 ? AMAP[u.appat] : null;
  if (ap) chance += ap.chance;
  const jour = estJour();
  const ok = p => p.zone === zone && (p.moment === 'tous' || (p.moment === 'jour') === jour) && (!p.meteo || p.meteo === meteo);
  const poids = CHANCES.map((b, i) => b * (1 + chance / 100 * i * 0.35));
  let tot = poids.reduce((a, b) => a + b, 0), r = Math.random() * tot, tier = 0;
  for (let i = 0; i < poids.length; i++) { r -= poids[i]; if (r <= 0) { tier = i; break; } }
  if (canne.instant) tier = 6; // Canne de Lane : chance infinie = toujours le plus rare possible
  let liste = [];
  for (let t = tier; t >= 0 && !liste.length; t--) liste = POISSONS.filter(p => p.r === t && ok(p));
  if (!liste.length) liste = POISSONS.filter(p => p.zone === zone && p.r === 0);
  let p = liste[Math.floor(Math.random() * liste.length)];
  if (opts.sansAppat) ap0 = true;
  if (!p) p = PMAP.maquereau;
  if (p.evenement) { // les monstres ne viennent que pendant leur événement
    const l3 = liste.filter(q => !q.evenement); p = l3.length ? l3[Math.floor(Math.random() * l3.length)] : PMAP[zone === 'gouffre' ? 'ombre' : 'maquereau'];
  }
  if (zone === 'mega') { // pendant l'événement : chance de ferrer le Mégalodon, sinon poissons du large
    const idM = { normal: 'megalodon', ancien: 'megaancien', fantome: 'megafantome' }[mega.variante] || 'megalodon';
    if (canne.instant || Math.random() < 0.18 * (1 + chance / 150)) p = PMAP[idM];
    else { const okL = q => q.zone === 'large' && q.r <= tier && (q.moment === 'tous' || (q.moment === 'jour') === jour) && (!q.meteo || q.meteo === meteo); const l2 = POISSONS.filter(okL); p = l2.length ? l2[Math.floor(Math.random() * l2.length)] : PMAP.maquereau; }
  }
  if (zone === 'gouffre' && kraken.actif && (canne.instant || Math.random() < 0.2 * (1 + chance / 150))) p = PMAP[kraken.variante === 'ancien' ? 'krakenancien' : 'grandkraken'];
  // poids : plus souvent petit que gros
  let kg = p.kg[0] + (p.kg[1] - p.kg[0]) * Math.pow(Math.random(), 1.6);
  let mut = null, mult = 1;
  for (const m of MUTATIONS.slice().sort((a, b) => a.chance - b.chance)) { // les plus rares d'abord
    if (Math.random() < Math.min(0.5, m.chance * (1 + chance / 200) * (ench.mut || 1))) { mut = m.id; mult = m.mult; kg *= m.poids; break; }
  }
  kg = Math.round(kg * 100) / 100;
  let vari = null;
  for (const v of VARIANTES) if (Math.random() < Math.min(0.45, v.chance * (1 + chance / 300))) { vari = v.id; mult *= v.mult; break; }
  const valeur = Math.max(1, Math.round(p.prix * kg * mult * (1 + (ench.valeur || 0))));
  if (ap) { u.appats[u.appat]--; if (u.appats[u.appat] <= 0) { delete u.appats[u.appat]; u.appat = null; } }
  return { uid: crypto.randomBytes(6).toString('hex'), id: p.id, kg, mut, vari, valeur };
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
function joueurDe(body) { const nom = DB.tokens[body.token]; const u = nom ? DB.users[nom.toLowerCase()] : null; if (u && banInfo(u)) { deconnecterTout(u.nom); return null; } return u; }
function monde() { return { h: heure(), meteo, jourMs: JOUR_MS, mega: mega.actif ? { x: mega.x, z: mega.z, reste: mega.fin - Date.now(), variante: mega.variante } : null, kraken: kraken.actif ? { reste: kraken.fin - Date.now(), variante: kraken.variante } : null, eclipse, boost: boostActif() > 1 ? { mult: boost.mult, reste: boost.fin - Date.now() } : null }; }

const routes = {
  '/api/data': async () => [200, { RARETES, POISSONS, CANNES, APPATS, TOTEMS, MUTATIONS, BATEAUX, ENCHANTS, PRIX_RELIQUE, SAC_MAX, OFFRANDE, FLAMMES, OBJETS, VARIANTES, CASIER_MS, monde: monde() }],

  '/api/inscription': async b => {
    const nom = String(b.nom || '').trim(), pass = String(b.pass || '');
    if (!/^[A-Za-z0-9_\-éèêàçÉÈ]{3,16}$/.test(nom)) return [400, { err: 'Pseudo : 3 à 16 lettres ou chiffres' }];
    if (pass.length < 3) return [400, { err: 'Mot de passe trop court (3 minimum)' }];
    if (DB.users[nom.toLowerCase()]) return [400, { err: 'Ce pseudo est déjà pris' }];
    if (nom.toLowerCase() === CREATEUR && !codeOK(b.code)) return [400, { err: 'Ce pseudo est réservé au Créateur du jeu (code secret demandé).', code: true }];
    const u = nouveauJoueur(nom, pass); DB.users[nom.toLowerCase()] = u;
    if (nom.toLowerCase() === CREATEUR) u.createurOK = true;
    const token = crypto.randomBytes(16).toString('hex'); DB.tokens[token] = nom; sauver();
    return [200, { token, etat: etat(u) }];
  },
  '/api/connexion': async b => {
    const u = DB.users[String(b.nom || '').trim().toLowerCase()];
    if (!u || hash(String(b.pass || ''), u.salt) !== u.pass) return [400, { err: 'Pseudo ou mot de passe incorrect' }];
    const bi = banInfo(u); if (bi) return [403, { err: texteBan(bi) }];
    if (u.nom.toLowerCase() === CREATEUR && !u.createurOK) { if (!codeOK(b.code)) return [400, { err: 'Compte du Créateur : entre ton code secret.', code: true }]; u.createurOK = true; }
    const token = crypto.randomBytes(16).toString('hex'); DB.tokens[token] = u.nom; sauver();
    return [200, { token, etat: etat(u) }];
  },
  '/api/moi': async b => { const u = joueurDe(b); if (!u) return [401, { err: 'Reconnecte-toi' }]; return [200, { etat: etat(u) }]; },

  '/api/sync': async b => {
    const u = joueurDe(b); if (!u) return [401, { err: 'Reconnecte-toi' }];
    const n = x => (typeof x === 'number' && isFinite(x) ? Math.round(x * 100) / 100 : 0);
    const srv = choisirSrv(u.nom, Number(b.srv) || 0);
    const bt = b.bt && BMAP[b.bt.t] ? { t: b.bt.t, x: n(b.bt.x), z: n(b.bt.z), ry: n(b.bt.ry), on: !!b.bt.on } : null;
    enLigne[u.nom] = { x: n(b.x), y: n(b.y), z: n(b.z), ry: n(b.ry), a: String(b.a || '').slice(0, 10), b: Array.isArray(b.b) ? b.b.slice(0, 3).map(n) : null, t: Date.now(), canne: u.canne, rod: b.rod !== false, bt, srv, role: role(u) };
    const autres = [];
    for (const k in enLigne) if (k !== u.nom && enLigne[k].srv === srv) { const o = enLigne[k]; autres.push({ nom: k, x: o.x, y: o.y, z: o.z, ry: o.ry, a: o.a, b: o.b, canne: o.canne, rod: o.rod, bt: o.bt, role: o.role }); }
    const depuis = Number(b.depuis) || 0;
    return [200, { autres, srv, nSrv: compteSrv(srv), maxSrv: MAX_SRV, monde: monde(), annonces: annonces.filter(a => a.t > depuis), now: Date.now(), role: role(u), demandes: (u.demandes || []).length }];
  },

  '/api/touche': async b => {
    const u = joueurDe(b); if (!u) return [401, { err: 'Reconnecte-toi' }];
    if (u.sac.length >= SAC_MAX) return [400, { err: 'Ton sac est plein ! Va vendre tes poissons au Marchand.' }];
    let zone = ZONES.includes(b.zone) ? b.zone : 'cote';
    if (zone === 'mega' && !mega.actif) zone = 'large';
    if (zone === 'gouffre' && false) zone = 'abysses';
    if (zone === 'gouffre' && !(u.quetes && u.quetes.gouffre)) return [400, { err: '🔒 Le Gouffre du Kraken est scellé. Réussis les 3 épreuves du Gardien !' }];
    u.enCoursZone = zone;
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
    // le monstre a déjà été attrapé par quelqu'un d'autre (ou il est reparti) → il s'échappe
    if ((p.evenement === 'mega' && !mega.actif) || (p.evenement === 'kraken' && !kraken.actif)) { sauver(); return [200, { rate: true, parti: true, id: f.id, err: (p.evenement === 'mega' ? '🦈 Le Mégalodon' : '🐙 Le Kraken') + ' s\'est échappé… il a déjà été attrapé !', etat: etat(u), monde: monde() }]; }
    ajouterPrise(u, f, u.enCoursZone);
    u.prises++; u.prisesCanne = u.prisesCanne || {}; u.prisesCanne[u.canne] = (u.prisesCanne[u.canne] || 0) + 1;
    const nouveau = f._nouveau; delete f._nouveau;
    const avant = u._avant; const apres = niveauDe(u.xp);
    sauver();
    if (p.r >= 4) annoncer('🎣 ' + u.nom + ' a attrapé un(e) ' + p.nom + ' (' + RARETES[p.r].nom + ') !');
    let bonus = null;
    if (u.enCoursZone === 'abysses' && !estJour() && !u.quetes.chant) { u.quetes.chant = true; bonus = '📜 Épreuve réussie : Le Chant des Profondeurs !'; verifQuetes(u); }
    if (f.id === 'krakenancien') annoncer('🐙🔥 ' + u.nom + ' a attrapé le KRAKEN ANCIEN !!! INCROYABLE !');
    if ((f.id === 'grandkraken' || f.id === 'krakenancien') && !u.cannes.includes('krakenrod')) { u.cannes.push('krakenrod'); bonus = '🐙 Tu as vaincu Le Kraken ! Tu gagnes la CANNE DU KRAKEN !'; annoncer('🐙 ' + u.nom + ' a attrapé LE KRAKEN !!!'); }
    if (f.id === 'megaancien' || f.id === 'megafantome') annoncer((f.id === 'megafantome' ? '👻 ' : '🦈 ') + u.nom + ' a attrapé le ' + PMAP[f.id].nom.toUpperCase() + ' !!!');
    if (f.id === 'megalodon' || f.id === 'megaancien' || f.id === 'megafantome') bonus = (bonus ? bonus + ' ' : '') + '🦈 Tu as vaincu un Mégalodon ! Une canne spéciale peut maintenant être achetée…';
    // une fois attrapé, le monstre PART (l'événement se termine pour tout le serveur)
    if (p.evenement === 'mega' && mega.actif) { if (mega.variante === 'fantome') eclipse = false; mega.actif = false; mega.prochain = Date.now() + 8 * 60000; annoncer('🦈 Le ' + NOM_MEGA[mega.variante] + ' a été attrapé par ' + u.nom + ' ! Il a disparu…'); }
    if (p.evenement === 'kraken' && kraken.actif) { kraken.actif = false; kraken.prochain = Date.now() + 11 * 60000; annoncer('🐙 Le ' + (kraken.variante === 'ancien' ? 'Kraken Ancien' : 'Kraken') + ' a été vaincu par ' + u.nom + ' ! Il a disparu…'); }
    sauver();
    return [200, { poisson: f, nouveau, niveauUp: apres > avant ? apres : 0, bonus, etat: etat(u), monde: monde() }];
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
    u.sac = garde; u.argent += total; u.gagne += total; avancerQuete(u, 'vendre', total); sauver();
    return [200, { total, n, etat: etat(u) }];
  },
  '/api/acheter': async b => {
    const u = joueurDe(b); if (!u) return [401, { err: 'Reconnecte-toi' }];
    const niv = niveauDe(u.xp);
    if (b.type === 'canne') {
      const c = CMAP[b.id]; if (!c) return [400, { err: 'Canne inconnue' }];
      if (u.cannes.includes(c.id)) return [400, { err: 'Tu as déjà cette canne' }];
      if (c.lieu === 'cachee' || c.lieu === 'recompense' || c.lieu === 'admin') return [400, { err: "Cette canne ne s'achète pas !" }];
      if (c.condition === 'megalodon' && !(u.carnet.megalodon || u.carnet.megaancien || u.carnet.megafantome)) return [400, { err: "Il faut d'abord attraper un Mégalodon !" }];
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
      if (u.argent < bt.prix) return [400, { err: "Pas assez d'argent" }];
      u.argent -= bt.prix; u.bateaux.push(bt.id); sauver();
      return [200, { etat: etat(u) }];
    }
    if (b.type === 'objet') {
      const o = OMAP[b.id]; if (!o) return [400, { err: 'Objet inconnu' }];
      if (!o.stack && u.objets[o.id]) return [400, { err: 'Tu l\'as déjà !' }];
      const n = o.stack ? Math.max(1, Math.min(10, Number(b.n) || 1)) : 1;
      if (u.argent < o.prix * n) return [400, { err: "Pas assez d'argent" }];
      u.argent -= o.prix * n; u.objets[o.id] = o.stack ? (u.objets[o.id] || 0) + n : true; sauver();
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
      if (t.id === 'eclipse' && Date.now() - dernierJourNuit > 10 * 60000) return [400, { err: "🌑 Le Totem Éclipse ne marche qu'APRÈS un Totem Jour/Nuit (utilisé il y a moins de 10 minutes)" }];
      if (t.id === 'eclipse' && eclipse) return [400, { err: '🌑 Il y a déjà une éclipse !' }];
      u.argent -= t.prix; totemCooldown = Date.now() + 20000;
      if (t.id === 'journuit') {
        mettreHeure(estJour() ? 21 : 8); dernierJourNuit = Date.now();
        const vite = Date.now() + 45000; if (!mega.actif) mega.prochain = Math.min(mega.prochain, Math.max(vite, mega.prochain - 4 * 60000)); if (!kraken.actif) kraken.prochain = Math.min(kraken.prochain, Math.max(vite, kraken.prochain - 5 * 60000));
      }
      if (t.id === 'eclipse') { eclipse = true; mettreHeure(13); if (!mega.actif) mega.prochain = Math.min(mega.prochain, Date.now() + 60000); annoncer('🌑 UNE ÉCLIPSE RECOUVRE LE CIEL… quelque chose de fantomatique approche 👻'); }
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
  '/api/offrande': async b => {
    const u = joueurDe(b); if (!u) return [401, { err: 'Reconnecte-toi' }];
    if (u.quetes.offrande) return [400, { err: 'Déjà fait !' }];
    const manque = OFFRANDE.filter(id => !u.sac.some(f => f.id === id));
    if (manque.length) return [400, { err: 'Il te manque : ' + manque.map(id => PMAP[id].nom).join(', ') }];
    for (const id of OFFRANDE) { const i = u.sac.findIndex(f => f.id === id); u.sac.splice(i, 1); }
    u.quetes.offrande = true; verifQuetes(u); sauver();
    return [200, { etat: etat(u) }];
  },
  '/api/flamme': async b => {
    const u = joueurDe(b); if (!u) return [401, { err: 'Reconnecte-toi' }];
    if (!FLAMMES.includes(b.id)) return [400, { err: '?' }];
    if (!u.quetes.flammes.includes(b.id)) u.quetes.flammes.push(b.id);
    verifQuetes(u); sauver();
    return [200, { n: u.quetes.flammes.length, etat: etat(u) }];
  },
  '/api/ramasser': async b => {
    const u = joueurDe(b); if (!u) return [401, { err: 'Reconnecte-toi' }];
    if (b.id !== 'naufrage') return [400, { err: '?' }];
    if (u.cannes.includes('naufrage')) return [400, { err: 'Tu as déjà cette canne' }];
    u.cannes.push('naufrage'); sauver(); annoncer('🧭 ' + u.nom + ' a trouvé une canne secrète !');
    return [200, { etat: etat(u) }];
  },
  '/api/casier/poser': async b => {
    const u = joueurDe(b); if (!u) return [401, { err: 'Reconnecte-toi' }];
    if (!(u.objets.casier > 0)) return [400, { err: "Tu n'as pas de casier. Achète-en chez le Quincaillier !" }];
    if (u.casiers.length >= 5) return [400, { err: '5 casiers maximum dans l\'eau en même temps' }];
    const x = Number(b.x), z = Number(b.z); if (!isFinite(x) || !isFinite(z)) return [400, { err: '?' }];
    u.objets.casier--; u.casiers.push({ id: crypto.randomBytes(4).toString('hex'), x: Math.round(x * 10) / 10, z: Math.round(z * 10) / 10, t: Date.now() }); sauver();
    return [200, { etat: etat(u) }];
  },
  '/api/casier/relever': async b => {
    const u = joueurDe(b); if (!u) return [401, { err: 'Reconnecte-toi' }];
    const i = u.casiers.findIndex(c => c.id === b.id); if (i < 0) return [400, { err: 'Casier introuvable' }];
    const c = u.casiers[i];
    if (Date.now() - c.t < CASIER_MS) return [400, { err: 'Pas encore prêt… encore ' + Math.ceil((CASIER_MS - (Date.now() - c.t)) / 1000) + ' s' }];
    u.casiers.splice(i, 1);
    const n = Math.random() < 0.35 ? 2 : 1, pris = [];
    for (let k = 0; k < n && u.sac.length < SAC_MAX; k++) { const f = tirerPoisson(u, 'casier', { sansAppat: true }); ajouterPrise(u, f, 'casier'); delete f._nouveau; pris.push(f); }
    u.objets.casier = (u.objets.casier || 0) + 1; // on récupère le casier
    avancerQuete(u, 'casier', 1); sauver();
    for (const f of pris) if (PMAP[f.id].r >= 4) annoncer('🦀 ' + u.nom + ' a trouvé un(e) ' + PMAP[f.id].nom + ' dans son casier !');
    return [200, { pris, etat: etat(u) }];
  },
  '/api/harpon': async b => {
    const u = joueurDe(b); if (!u) return [401, { err: 'Reconnecte-toi' }];
    if (!u.objets.harpon || !u.objets.plongee) return [400, { err: 'Il te faut un harpon et un équipement de plongée' }];
    if (u.sac.length >= SAC_MAX) return [400, { err: 'Ton sac est plein !' }];
    if (Date.now() - (u.dernierHarpon || 0) < 1200) return [400, { err: 'Recharge…' }];
    u.dernierHarpon = Date.now();
    let zone = ZONES.includes(b.zone) ? b.zone : 'large'; if (zone === 'gouffre' && !u.quetes.gouffre) zone = 'abysses'; if (zone === 'mega') zone = 'large';
    const f = tirerPoisson(u, Math.random() < 0.4 ? 'errant' : zone, { sansAppat: true });
    ajouterPrise(u, f, zone); const nouveau = f._nouveau; delete f._nouveau; u.prises++; sauver();
    if (PMAP[f.id].r >= 4) annoncer('🔱 ' + u.nom + ' a harponné un(e) ' + PMAP[f.id].nom + ' !');
    return [200, { poisson: f, nouveau, etat: etat(u) }];
  },
  '/api/quete': async b => {
    const u = joueurDe(b); if (!u) return [401, { err: 'Reconnecte-toi' }];
    if (b.action === 'prendre') {
      if (u.quete && !u.quete.fini) return [400, { err: 'Tu as déjà une quête en cours' }];
      const m = QUETES_MODELES[Math.floor(Math.random() * QUETES_MODELES.length)];
      const n = m.n[0] + Math.floor(Math.random() * (m.n[1] - m.n[0] + 1));
      const zone = m.zones ? m.zones[Math.floor(Math.random() * m.zones.length)] : null;
      const nn = m.type === 'vendre' ? Math.round(n / 100) * 100 : n;
      u.quete = { type: m.type, zone, r: m.r, n: nn, fait: 0, fini: false, txt: m.txt(zone).replace('{n}', nn), gain: Math.round(m.gain * (m.type === 'vendre' ? 1 : Math.max(1, nn / 3)) * (1 + niveauDe(u.xp) / 20)) };
      sauver(); return [200, { etat: etat(u) }];
    }
    if (b.action === 'rendre') {
      const q = u.quete; if (!q || !q.fini) return [400, { err: 'Quête pas encore finie' }];
      u.argent += q.gain; u.xp += 40; let bonus = '';
      if (Math.random() < 0.4) { u.objets.casier = (u.objets.casier || 0) + 2; bonus = ' + 2 casiers'; }
      else if (Math.random() < 0.5) { u.appats.crevette = (u.appats.crevette || 0) + 10; bonus = ' + 10 crevettes'; }
      const gain = q.gain; u.quete = null; sauver();
      return [200, { gain, bonus, etat: etat(u) }];
    }
    if (b.action === 'abandonner') { u.quete = null; sauver(); return [200, { etat: etat(u) }]; }
    return [400, { err: '?' }];
  },
  '/api/amis': async b => {
    const u = joueurDe(b); if (!u) return [401, { err: 'Reconnecte-toi' }];
    u.amis = u.amis || []; u.demandes = u.demandes || [];
    const autre = b.nom ? DB.users[String(b.nom).trim().toLowerCase()] : null;
    if (b.action === 'demander') {
      if (!autre) return [400, { err: 'Joueur introuvable' }];
      if (autre === u) return [400, { err: 'Tu ne peux pas être ami avec toi-même 😄' }];
      if (u.amis.includes(autre.nom)) return [400, { err: 'Vous êtes déjà amis' }];
      autre.demandes = autre.demandes || [];
      if ((u.demandes || []).includes(autre.nom)) { // il m'avait déjà demandé : on accepte direct
        u.demandes = u.demandes.filter(n => n !== autre.nom); u.amis.push(autre.nom); autre.amis = autre.amis || []; if (!autre.amis.includes(u.nom)) autre.amis.push(u.nom);
      } else if (!autre.demandes.includes(u.nom)) autre.demandes.push(u.nom);
      sauver(); return [200, { ok: 'Demande envoyée à ' + autre.nom + ' !', etat: etat(u) }];
    }
    if (b.action === 'accepter' || b.action === 'refuser') {
      const n = (u.demandes || []).find(x => x.toLowerCase() === String(b.nom).toLowerCase()); if (!n) return [400, { err: 'Pas de demande' }];
      u.demandes = u.demandes.filter(x => x !== n);
      if (b.action === 'accepter' && autre) { if (!u.amis.includes(autre.nom)) u.amis.push(autre.nom); autre.amis = autre.amis || []; if (!autre.amis.includes(u.nom)) autre.amis.push(u.nom); }
      sauver(); return [200, { etat: etat(u) }];
    }
    if (b.action === 'retirer') { u.amis = u.amis.filter(n => n.toLowerCase() !== String(b.nom).toLowerCase()); if (autre) autre.amis = (autre.amis || []).filter(n => n !== u.nom); sauver(); return [200, { etat: etat(u) }]; }
    // liste
    const liste = u.amis.filter(n => DB.users[n.toLowerCase()]).map(n => { const o = enLigne[n]; return { nom: n, enLigne: !!o, srv: o ? o.srv : null, n: o ? compteSrv(o.srv) : 0, niv: niveauDe(DB.users[n.toLowerCase()].xp) }; });
    return [200, { liste, demandes: u.demandes, monSrv: srvDe[u.nom.toLowerCase()] || null, max: MAX_SRV, etat: etat(u) }];
  },
  '/api/admin': async b => {
    const u = joueurDe(b); if (!u) return [401, { err: 'Reconnecte-toi' }];
    if (b.action === 'code') { if (u.nom.toLowerCase() !== CREATEUR) return [403, { err: 'Non' }]; if (!codeOK(b.code)) return [400, { err: 'Code incorrect' }]; u.createurOK = true; sauver(); return [200, { etat: etat(u) }]; }
    const R = role(u); if (!R) return [403, { err: "Tu n'as pas les pouvoirs" }];
    const C = R === 'createur';
    const cible = b.nom ? DB.users[String(b.nom).toLowerCase()] : null;
    const proteger = () => cible && (role(cible) === 'createur' || (role(cible) === 'admin' && !C));
    const titre = C ? '👑 [Créateur] ' : '🛡️ [Admin] ';
    switch (b.action) {
      case 'joueurs': {
        const q = String(b.q || '').toLowerCase();
        const l = Object.values(DB.users).filter(x => !q || x.nom.toLowerCase().includes(q)).map(x => ({ nom: x.nom, niv: niveauDe(x.xp), argent: x.argent, enLigne: !!enLigne[x.nom], srv: enLigne[x.nom] ? enLigne[x.nom].srv : null, role: role(x), ban: banInfo(x) ? texteBan(x.ban) : null }))
          .sort((a, c) => (c.enLigne - a.enLigne) || a.nom.localeCompare(c.nom)).slice(0, 60);
        return [200, { liste: l, total: Object.keys(DB.users).length }];
      }
      case 'meteo': if (!['soleil', 'nuageux', 'pluie', 'brouillard'].includes(b.v)) return [400, { err: '?' }]; meteo = b.v; meteoFin = Date.now() + 8 * 60000; annoncer(titre + 'a changé la météo : ' + TEXTE_METEO[b.v]); break;
      case 'heure': mettreHeure(clamp(Number(b.v) || 12, 0, 23.9)); annoncer(titre + "a changé l'heure !"); break;
      case 'mega': if (b.v) { const v = ['normal', 'ancien', 'fantome'].includes(b.variante) ? b.variante : 'normal'; if (v === 'fantome') eclipse = true; lancerMega(v); annoncer(titre + 'a fait apparaître le ' + NOM_MEGA[v] + ' !'); } else { if (mega.variante === 'fantome') eclipse = false; mega.actif = false; mega.prochain = Date.now() + 8 * 60000; annoncer('🦈 Le Mégalodon est reparti…'); } break;
      case 'kraken': if (b.v) { const v = b.variante === 'ancien' ? 'ancien' : 'normal'; lancerKraken(v); annoncer(titre + 'a réveillé le ' + (v === 'ancien' ? 'KRAKEN ANCIEN' : 'KRAKEN') + ' !'); } else { kraken.actif = false; kraken.prochain = Date.now() + 11 * 60000; annoncer('🐙 Le Kraken est retourné au fond du Gouffre…'); } break;
      case 'eclipse': eclipse = !!b.v; if (eclipse) annoncer('🌑 ' + titre + 'a lancé une ÉCLIPSE !'); break;
      case 'boost': { const m = clamp(Number(b.mult) || 2, 2, 10), min = clamp(Number(b.min) || 5, 1, 60); boost = { mult: m, fin: Date.now() + min * 60000 }; annoncer('🍀 ' + titre + 'lance un BOOST DE CHANCE ×' + m + ' pendant ' + min + ' minutes pour tout le monde !'); break; }
      case 'annonce': { const t = String(b.txt || '').trim().slice(0, 140); if (!t) return [400, { err: 'Message vide' }]; annoncer('📢 ' + titre + u.nom + ' : ' + t); break; }
      case 'ban': {
        if (!cible) return [400, { err: 'Joueur introuvable' }]; if (proteger() || cible === u) return [403, { err: 'Tu ne peux pas bannir ce joueur' }];
        const min = Number(b.min) || 0; if (!min && !C) return [403, { err: 'Seul le Créateur peut bannir définitivement' }];
        cible.ban = { fin: min ? Date.now() + min * 60000 : 0, raison: String(b.raison || '').slice(0, 80), par: u.nom }; deconnecterTout(cible.nom);
        annoncer('⛔ ' + cible.nom + ' a été banni ' + (min ? 'temporairement' : 'définitivement') + '.'); break;
      }
      case 'deban': if (!cible) return [400, { err: 'Joueur introuvable' }]; cible.ban = null; break;
      case 'supprimer': {
        if (!C) return [403, { err: 'Seul le Créateur peut supprimer un compte' }];
        if (!cible || cible === u) return [400, { err: 'Impossible' }];
        deconnecterTout(cible.nom); delete DB.users[cible.nom.toLowerCase()];
        for (const x of Object.values(DB.users)) { if (x.amis) x.amis = x.amis.filter(n => n !== cible.nom); if (x.demandes) x.demandes = x.demandes.filter(n => n !== cible.nom); }
        break;
      }
      case 'admin': if (!C) return [403, { err: 'Seul le Créateur peut nommer des admins' }]; if (!cible || cible === u) return [400, { err: 'Impossible' }]; cible.admin = !!b.v; annoncer(b.v ? '🛡️ ' + cible.nom + ' est maintenant ADMIN !' : '🛡️ ' + cible.nom + " n'est plus admin."); break;
      case 'argent': { if (!C) return [403, { err: 'Seul le Créateur peut donner de l\'argent' }]; const x = cible || u; x.argent = Math.max(0, x.argent + Math.round(Number(b.v) || 0)); break; }
      case 'niveau': { if (!C) return [403, { err: 'Créateur seulement' }]; const x = cible || u; const n = clamp(Number(b.v) || 1, 1, 200); x.xp = xpPourNiveau(n); break; }
      case 'canne': { if (!C) return [403, { err: 'Créateur seulement' }]; const x = cible || u; const ids = b.v === 'toutes' ? CANNES.filter(c => c.lieu !== 'admin').map(c => c.id) : [b.v]; for (const id of ids) if (CMAP[id] && !x.cannes.includes(id)) x.cannes.push(id); if (b.v === 'lane' && x !== u) annoncer('🫏 ' + x.nom + ' a reçu la CANNE DE LANE du Créateur !'); break; }
      case 'retirerCanne': { if (!C) return [403, { err: 'Créateur seulement' }]; const x = cible || u; if (b.v === 'bambou') break; x.cannes = x.cannes.filter(c => c !== b.v); if (x.canne === b.v) x.canne = 'bambou'; break; }
      case 'tout': { if (!C) return [403, { err: 'Créateur seulement' }]; const x = cible || u; x.bateaux = BATEAUX.map(b2 => b2.id); for (const o of OBJETS) x.objets[o.id] = o.stack ? (x.objets[o.id] || 0) + 10 : true; x.reliques = (x.reliques || 0) + 5; break; }
      case 'epreuves': { if (!C) return [403, { err: 'Créateur seulement' }]; const x = cible || u; x.quetes = { offrande: true, flammes: ['braise', 'givre', 'marais', 'recif'], chant: true, gouffre: true }; if (!x.cannes.includes('ancestrale')) x.cannes.push('ancestrale'); break; }
      default: return [400, { err: 'Action inconnue' }];
    }
    sauver(); return [200, { ok: true, etat: etat(u), monde: monde() }];
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
chargerDB().catch(e => { console.error('❌ Chargement Upstash impossible :', e.message, '→ sauvegarde désactivée pour ne rien écraser'); chargementRate = true; }).then(() => server.listen(PORT, () => console.log('🎣 Fish and Sell en ligne sur le port ' + PORT)));

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
#aide{position:fixed;left:12px;bottom:90px;font-size:13px;opacity:.85;z-index:4;max-width:60vw;pointer-events:none}
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
#hotbar{position:fixed;left:50%;bottom:10px;transform:translateX(-50%);z-index:6;display:flex;gap:5px}
#boussole{position:fixed;left:50%;top:8px;transform:translateX(-50%);width:300px;height:30px;overflow:hidden;z-index:5;pointer-events:none;-webkit-mask-image:linear-gradient(90deg,transparent,#000 25%,#000 75%,transparent);mask-image:linear-gradient(90deg,transparent,#000 25%,#000 75%,transparent)}
#bstrip{position:absolute;top:2px;left:0;height:22px;font-weight:900;font-style:italic;font-size:16px;text-shadow:0 2px 0 #000}
#bstrip span{position:absolute;transform:translateX(-50%)}
#bmark{position:absolute;left:50%;bottom:-2px;transform:translateX(-50%);font-size:10px;color:#fff}
body:not(.touch) #hud{left:auto;right:14px;top:auto;bottom:14px;text-align:right}
body:not(.touch) #xpbar{margin-left:auto}
body:not(.touch) #argent{font-size:30px;color:#ffe066;text-shadow:0 3px 0 #6a4a00}
.slot{position:relative;width:76px;height:70px;border-radius:12px;background:#0008;border:3px solid #ffffff40;font-size:28px;display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer}
.slot.on{border-color:#ffe066;background:#3a3000b0;box-shadow:0 0 12px #ffe06688}
.slot .k{position:absolute;left:5px;top:2px;font-size:12px;font-weight:900}
.slot .n{font-size:11px;font-weight:800;margin-top:-2px;text-align:center;line-height:1.1;padding:0 2px}
#slot1 .n{font-size:12px;color:#5fe0ff}
.label.ile{color:#fff;font-size:17px;font-weight:900;opacity:.95}
#bSaut{position:fixed;right:216px;bottom:100px;width:70px;height:70px;border-radius:50%;z-index:6;font-size:26px}
.touch #btns{bottom:12px}
.touch .slot{width:58px;height:56px;font-size:22px}.touch #slotSaut{display:none}.touch .slot .n{font-size:9px}
.touch #boussole{top:4px;width:220px}
.touch #bCast{bottom:76px}
.touch #bE{bottom:86px;right:128px}
.touch #bSaut{bottom:86px;right:208px}
@media (max-width:760px){.touch #btns{top:96px;bottom:auto;left:12px;right:auto;flex-direction:row;gap:5px}.touch #btns .btn{padding:7px 10px;font-size:13px}.touch #toasts{top:140px}.touch #hudR{font-size:12px}.touch #heure{font-size:17px}}

#panel.grand .win{width:min(96vw,1100px);max-height:90vh}
.vig{width:100%;aspect-ratio:1;object-fit:contain;display:block}
.vig.grand{width:180px;margin:0 auto}
.barhaut{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;background:#0003;border-radius:12px;padding:8px 10px;margin-bottom:6px}
.btn.mini{padding:5px 8px;font-size:12px;margin-top:4px}
.btn.large{width:100%;margin-top:8px;background:#0000;border:2px solid #7dff8a;box-shadow:none;color:#7dff8a}
.btn.jaune.large{border-color:#ffe066;color:#ffe066}
.btn.gris.large{border-color:#aaa;color:#ccc}
.fgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(118px,1fr));gap:8px}
.fcard{position:relative;background:linear-gradient(180deg,#0a1a2a,#06101c);border:2px solid #ffffff18;border-radius:10px;padding:6px 6px 8px;text-align:center;box-shadow:inset 0 -3px 0 var(--rc)}
.fcard.sel{cursor:pointer}.fcard.sel:hover,.fcard.on{border-color:var(--rc)}
.fcard .fn{font-weight:900;font-size:13px;font-style:italic;text-shadow:0 2px 0 #000}
.fcard .fs{font-size:11px;opacity:.85}.fcard .fv{font-weight:900;color:#7dff8a;font-size:13px}
.fcard .lock{position:absolute;top:4px;right:4px;background:#0008;border:none;border-radius:6px;font-size:14px;cursor:pointer;padding:2px 4px}
.vide{opacity:.75;text-align:center;padding:30px 10px}
.carnet{display:grid;grid-template-columns:170px 1fr 220px;gap:10px;min-height:420px}
.ctabs{display:flex;flex-direction:column;gap:6px;overflow:auto;max-height:66vh}
.ctab{background:linear-gradient(180deg,#22323f,#111b24);color:#fff;border:2px solid #ffffff22;border-radius:8px;padding:10px 6px;font-weight:900;font-style:italic;cursor:pointer;font-size:14px}
.ctab.on{border-color:#ffe066;color:#ffe066}
.cmid{display:flex;flex-direction:column;min-width:0}
.ctitre{font-size:20px;font-weight:900;font-style:italic;margin-bottom:6px}
.cmid .fgrid{overflow:auto;max-height:58vh;padding-right:4px}
.cbas{margin-top:8px;font-style:italic;color:#ffe066;font-weight:800}
.cinfo{background:#0003;border-radius:12px;padding:10px;text-align:center}
.cinfo .lig{background:#ffffff10;border-radius:8px;padding:6px;margin:5px 0;font-size:13px;font-weight:700}
.bgrid{display:flex;flex-direction:column;gap:10px}
.bcard{display:flex;gap:14px;align-items:center;background:linear-gradient(90deg,#0a0f16,#111a24);border:2px solid #ffffff20;border-radius:12px;padding:10px}
.bcard .vig{width:170px;flex:none}
.binfo{flex:1}.bn{font-size:22px;font-weight:900;font-style:italic;color:#ffb020}.bd{font-size:13px;font-style:italic;opacity:.85;margin-bottom:6px}.bs{font-size:14px;font-style:italic;opacity:.9}
.rgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:10px}
.rcard{background:linear-gradient(180deg,#141c26,#0a0f16);border:2px solid #ffffff20;border-radius:12px;padding:10px;text-align:center}
.rcard.on{border-color:#5fe0ff;box-shadow:0 0 14px #5fe0ff55}
.rstats{text-align:left;font-size:12.5px;font-weight:800;font-style:italic;line-height:1.5;opacity:.95}
.rcard .vig{width:150px;margin:4px auto}
.rn{font-size:17px;font-weight:900;color:#ffb020;font-style:italic}
.ren{font-weight:900;color:#c08aff;font-style:italic}
@media (max-width:760px){.carnet{grid-template-columns:1fr}.ctabs{flex-direction:row;flex-wrap:wrap;max-height:none}.ctab{padding:6px 8px;font-size:12px}.bcard .vig{width:110px}}

.slot.off{opacity:.35}
#oxy{position:fixed;left:50%;top:44px;transform:translateX(-50%);z-index:7;text-align:center;font-weight:900;text-shadow:0 2px 0 #000}
#oxy .b{width:260px;height:14px;border:2px solid #fff;border-radius:8px;background:#0008;overflow:hidden;margin-top:3px}
#oxy .b div{height:100%;background:linear-gradient(90deg,#e5484d,#5fe0ff);width:100%}
#queteHud{position:fixed;right:14px;top:120px;z-index:5;max-width:260px;text-align:right;font-weight:800;font-size:14px;background:#0006;padding:6px 10px;border-radius:10px;pointer-events:none}
#bPlonge{position:fixed;left:50%;bottom:92px;transform:translateX(-50%);z-index:7;display:none}
#sousleau{position:fixed;inset:0;z-index:2;pointer-events:none;background:radial-gradient(circle at 50% 40%,#2a9ad044,#04305acc);mix-blend-mode:multiply}
.fcard.brillant{box-shadow:inset 0 -3px 0 var(--rc),0 0 10px #ffe06699;border-color:#ffe06688}
.fcard.scint{box-shadow:inset 0 -3px 0 var(--rc),0 0 16px #9ff6ff;border-color:#9ff6ffaa;background:linear-gradient(180deg,#123a4a,#06101c)}
.vari{font-weight:900;font-size:11px}

.label.pseudo{font-size:15px;color:#fff;background:#0006;padding:1px 8px;border-radius:8px}
.label.pseudo.moi{color:#bff6ff}
.label.pseudo.createur{color:#ffd84a;font-size:17px;background:#3a2a00aa;border:1px solid #ffd84a}
.label.pseudo.admin{color:#ff8a8a}
#srvHud{font-weight:800;opacity:.95}
#boostHud{font-weight:900;color:#7dff8a}
.badge{position:absolute;top:-4px;right:-4px;background:#e5484d;color:#fff;border-radius:10px;font-size:11px;padding:1px 6px;font-weight:900}
.arow{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0}
.arow .btn{padding:7px 10px;font-size:13px}
.ain{padding:8px 10px;border-radius:10px;border:none;font-size:14px;min-width:120px;color:#123}

#cinFx{position:fixed;inset:0;z-index:3;pointer-events:none}
#cinFx.aurore{background:linear-gradient(170deg,#0000 15%,#2aff8a66 30%,#0000 42%,#5affc055 52%,#0000 66%),linear-gradient(#050a2acc,#0a1a3a88 60%,#0000);animation:aurore 2s infinite alternate}
@keyframes aurore{from{filter:hue-rotate(0deg);opacity:.7}to{filter:hue-rotate(40deg);opacity:1}}
#cinFx.fantome{background:radial-gradient(circle,#0000 40%,#bff4ff55 100%)}
#cinFx.flash{background:#bfe8ff;opacity:0;animation:flash .25s}
@keyframes flash{from{opacity:.95}to{opacity:0}}
#cinTitre{position:fixed;left:50%;top:18%;transform:translateX(-50%);z-index:22;font-size:min(9vw,64px);font-weight:900;font-style:italic;color:#fff;text-shadow:0 5px 0 #000,0 0 30px #ff4040;white-space:nowrap;animation:cinT .5s}
@keyframes cinT{from{transform:translateX(-50%) scale(2.2);opacity:0}to{transform:translateX(-50%) scale(1);opacity:1}}
#cinBandes div{position:fixed;left:0;right:0;height:9vh;background:#000;z-index:21}
#cinBandes div:first-child{top:0}#cinBandes div:last-child{bottom:0}
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
  <input id="lcode" class="hide" type="password" placeholder="🔑 Code secret du Créateur">
  <button class="btn vert" id="bJouer">▶ JOUER</button>
  <button class="btn" id="bCreer">✨ Créer un compte</button>
  <div id="lmsg"></div>
</div></div>

<div id="jeu" class="hide">
  <div id="hud" class="txt"><div id="argent">0 $</div><div id="niv">Niveau 1</div><div id="xpbar"><div></div></div></div>
  <div id="hudR" class="txt"><div id="heure">08:00</div><div id="meteo">☀️ Soleil</div><div id="zone"></div><div id="appatInfo"></div><div id="srvHud"></div><div id="boostHud"></div></div>
  <div id="btns" class="hide">
    <button class="btn" id="bSac">🎒 Sac</button>
    <button class="btn jaune" id="bCarnet">📖 Carnet</button>
    <button class="btn" id="bCarte">🗺️</button>
    <button class="btn gris" id="bTop">🏆</button>
  </div>
  <div id="aide" class="txt">ZQSD : bouger • ESPACE : sauter • Shift : courir • Clic droit + glisser : caméra • Molette : zoom<br>Clic gauche maintenu : lancer • 1 : canne • 2 : sac • 3 : carnet • 4 : inventaire • 5 : carte • E : parler / bateau • R : ramener</div>
  <div id="boussole"><div id="bstrip"></div><div id="bmark">▲</div></div>
  <div id="hotbar">
    <div class="slot on" id="slot1"><span class="k">1</span><div class="n" id="slot1n">Canne</div></div>
    <div class="slot" data-k="2"><span class="k">2</span>🎒<div class="n">Sac</div></div>
    <div class="slot" data-k="3"><span class="k">3</span>📖<div class="n">Carnet</div></div>
    <div class="slot" data-k="4"><span class="k">4</span>🧰<div class="n">Inventaire</div></div>
    <div class="slot" data-k="5"><span class="k">5</span>🗺️<div class="n">Carte</div></div>
    <div class="slot" data-k="6"><span class="k">6</span>🏆<div class="n">Classement</div></div>
    <div class="slot" id="slot7"><span class="k">7</span>🦀<div class="n" id="slot7n">Casier</div></div>
    <div class="slot" id="slot8"><span class="k">8</span>🪂<div class="n">Planeur</div></div>
    <div class="slot" id="slot9"><span class="k">9</span>📡<div class="n">Radar</div></div>
    <div class="slot" id="slotAmis"><span class="k">0</span>👥<div class="n">Amis</div><span class="badge hide" id="badgeAmis">!</span></div>
    <div class="slot hide" id="slotAdmin" style="border-color:#ffd84a"><span class="k">K</span>👑<div class="n" id="slotAdminN">Créateur</div></div>
    <div class="slot" id="slotSaut" style="width:92px"><span class="k">ESPACE</span>⤴️<div class="n">Sauter</div></div>
  </div>
  <div id="oxy" class="hide"><div class="t">🤿 Oxygène</div><div class="b"><div></div></div></div>
  <div id="queteHud" class="hide txt"></div>
  <button class="btn" id="bPlonge" class="hide">🤿 Plonger (G)</button>
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
    <button class="btn jaune" id="bSaut" style="font-size:14px">⤴<br>SAUTER</button>
    <button class="btn" id="bCast">🎣<br>PÊCHER</button>
  </div>
</div>
<div id="labels"></div>
<div id="sousleau" class="hide"></div>
<div id="cinFx" class="hide"></div><div id="cinTitre" class="hide"></div><div id="cinBandes" class="hide"><div></div><div></div></div>
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
uniform vec3 sunDir;uniform vec3 sunCol;uniform vec3 amb;uniform vec3 fogCol;uniform vec3 cam;uniform vec3 tint;uniform vec3 zen;uniform vec3 halo;uniform vec3 sunPos;
uniform float fogN;uniform float fogF;uniform float wave;uniform float unlit;uniform float nofog;uniform float alpha;uniform float t;uniform float sky;uniform float det;
uniform sampler2D hmap;
varying vec3 vc;varying vec3 vn;varying vec3 vw;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float vnoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(hash(i),hash(i+vec2(1.0,0.0)),f.x),mix(hash(i+vec2(0.0,1.0)),hash(i+vec2(1.0,1.0)),f.x),f.y);}
vec3 tone(vec3 c){c*=1.12;return clamp((c*(2.51*c+0.03))/(c*(2.43*c+0.59)+0.14),0.0,1.0);}
void main(){
  if(sky>0.5){
    vec3 d=normalize(vw-cam);float up=max(d.y,0.0);
    vec3 c=mix(fogCol,zen,pow(up,0.5));
    float s=max(dot(d,sunPos),0.0);
    c+=halo*(pow(s,900.0)*3.0+pow(s,60.0)*0.45+pow(s,7.0)*0.18);
    gl_FragColor=vec4(c,1.0);return;
  }
  vec3 base=vc*tint;
  if(det>0.5){float n=vnoise(vw.xz*1.3)*0.5+vnoise(vw.xz*4.7)*0.3+vnoise(vw.xz*0.23)*0.2;base*=0.82+0.34*n;}
  vec3 col;float a=alpha;
  if(unlit>0.5){col=base;}
  else{
    vec3 N=normalize(vn);
    if(wave>0.5){
      float h=texture2D(hmap,(vw.xz+420.0)/840.0).r*30.0-10.0;float depth=max(-h,0.0);
      vec3 N2=normalize(N+vec3(sin(vw.x*2.1+t*2.6)+sin(vw.z*1.7-t*2.2+vw.x*0.4),0.0,cos(vw.z*2.3+t*2.1)+cos(vw.x*1.9-t*2.4))*0.05);
      vec3 V=normalize(cam-vw);
      vec3 shallow=vec3(0.16,0.74,0.78),deep=vec3(0.02,0.20,0.40);
      vec3 wc=mix(shallow,deep,smoothstep(0.0,7.0,depth))*(amb*0.95+sunCol*0.55);
      float fr=0.03+0.97*pow(1.0-max(dot(N2,V),0.0),5.0);
      vec3 refl=mix(fogCol,zen,0.45);
      col=mix(wc,refl,clamp(fr*0.8,0.0,0.85));
      vec3 H=normalize(V+sunDir);
      float sp=pow(max(dot(N2,H),0.0),220.0)*2.5+pow(max(dot(N2,H),0.0),28.0)*0.12;
      col+=sunCol*sp;
      float fo=smoothstep(0.9,0.0,depth)*(0.55+0.45*sin(vw.x*3.0+vw.z*2.0+t*2.5));
      fo+=smoothstep(0.62,1.0,vnoise(vw.xz*0.9+vec2(t*0.3,t*0.2)))*0.35*smoothstep(4.0,0.5,depth);
      col=mix(col,vec3(0.95)*(amb+sunCol*0.65),clamp(fo,0.0,0.85));
      a=mix(0.5,0.94,smoothstep(0.0,5.0,depth));
    } else {
      float d=max(dot(N,sunDir),0.0);
      vec3 hemi=mix(amb*0.5,amb*1.15,N.y*0.5+0.5);
      col=base*(hemi+sunCol*d*1.05);
    }
    col=tone(col);
  }
  if(nofog<0.5){
    float dist=length(cam-vw);
    float f=clamp((dist-fogN)/(fogF-fogN),0.0,1.0);
    col=mix(col,fogCol,f);
  }
  gl_FragColor=vec4(col,a);
}\`;
function sh(type, src) { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; }
const prog = gl.createProgram();
gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(prog);
if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
gl.useProgram(prog);
const A = { p: gl.getAttribLocation(prog, 'p'), n: gl.getAttribLocation(prog, 'n'), c: gl.getAttribLocation(prog, 'c') };
const U = {}; ['vp', 'm', 'wave', 't', 'ps', 'sunDir', 'sunCol', 'amb', 'fogCol', 'cam', 'tint', 'fogN', 'fogF', 'unlit', 'nofog', 'alpha', 'zen', 'halo', 'sunPos', 'sky', 'det', 'hmap'].forEach(k => U[k] = gl.getUniformLocation(prog, k));
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
// terrain lisse : normales et couleurs par sommet
function terrainGrid(b, X0, Z0, N, S, colFn, skipFn) {
  const W1 = N + 1, hs = new Float32Array(W1 * W1);
  for (let i = 0; i <= N; i++) for (let j = 0; j <= N; j++) hs[i * W1 + j] = H(X0 + i * S, Z0 + j * S);
  const hv = (i, j) => hs[clamp(i, 0, N) * W1 + clamp(j, 0, N)];
  const nor = [], cols = [];
  for (let i = 0; i <= N; i++) for (let j = 0; j <= N; j++) {
    const nx = hv(i - 1, j) - hv(i + 1, j), nz = hv(i, j - 1) - hv(i, j + 1), ny = 2 * S; const l = Math.hypot(nx, ny, nz);
    const n = [nx / l, ny / l, nz / l]; nor.push(n);
    cols.push(colFn(X0 + i * S, Z0 + j * S, hv(i, j), n[1]));
  }
  const V = (i, j) => { const k = i * W1 + j, n = nor[k], c = cols[k]; b.v(X0 + i * S, hs[k], Z0 + j * S, n[0], n[1], n[2], c); };
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
    if (skipFn && skipFn(hv(i, j), hv(i + 1, j), hv(i, j + 1), hv(i + 1, j + 1))) continue;
    V(i, j); V(i + 1, j + 1); V(i + 1, j); V(i, j); V(i, j + 1); V(i + 1, j + 1);
  }
}
function mkMesh(b, mode) {
  const mk = arr => { const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(arr), gl.STATIC_DRAW); return buf; };
  const bb = [1e9, 1e9, 1e9, -1e9, -1e9, -1e9];
  for (let i = 0; i < b.p.length; i += 3) for (let k = 0; k < 3; k++) { if (b.p[i + k] < bb[k]) bb[k] = b.p[i + k]; if (b.p[i + k] > bb[k + 3]) bb[k + 3] = b.p[i + k]; }
  return { pb: mk(b.p), nb: mk(b.n), cb: mk(b.c), count: b.p.length / 3, mode: mode === undefined ? gl.TRIANGLES : mode, bb };
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
  gl.uniform1f(U.sky, o.sky ? 1 : 0); gl.uniform1f(U.det, o.det ? 1 : 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, me.pb); gl.vertexAttribPointer(A.p, 3, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, me.nb); gl.vertexAttribPointer(A.n, 3, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, me.cb); gl.vertexAttribPointer(A.c, 3, gl.FLOAT, false, 0, 0);
  gl.drawArrays(me.mode, 0, me.count);
}
const IDM = M4.id();
// ---------- vignettes 3D (images des poissons, cannes, bateaux) ----------
let FB = null; const VIGN = {};
function vignette(key, mesh, o) {
  o = o || {}; const k2 = key + (o.noir ? '_n' : '');
  if (VIGN[k2]) return VIGN[k2];
  const S = 160;
  if (!FB) {
    FB = { fb: gl.createFramebuffer(), tex: gl.createTexture(), rb: gl.createRenderbuffer() };
    gl.bindTexture(gl.TEXTURE_2D, FB.tex); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, S, S, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.bindRenderbuffer(gl.RENDERBUFFER, FB.rb); gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, S, S);
    gl.bindFramebuffer(gl.FRAMEBUFFER, FB.fb); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, FB.tex, 0);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, FB.rb);
    if (HTEX) { gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, HTEX); }
  }
  gl.bindFramebuffer(gl.FRAMEBUFFER, FB.fb); gl.viewport(0, 0, S, S);
  gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  const bb = mesh.bb, c = [(bb[0] + bb[3]) / 2, (bb[1] + bb[4]) / 2, (bb[2] + bb[5]) / 2];
  const r = Math.max(0.2, Math.hypot(bb[3] - bb[0], bb[4] - bb[1], bb[5] - bb[2]) / 2);
  const dir = o.dir || [0.75, 0.35, 0.55]; const dl = Math.hypot(...dir);
  const eye = [c[0] + dir[0] / dl * r * 2.3, c[1] + dir[1] / dl * r * 2.3, c[2] + dir[2] / dl * r * 2.3];
  const VPm = M4.mul(M4.persp(0.8, 1, 0.05, r * 10), M4.look(eye, c, [0, 1, 0]));
  gl.uniformMatrix4fv(U.vp, false, VPm);
  gl.uniform3fv(U.sunDir, [0.4, 0.8, 0.45]); gl.uniform3fv(U.sunCol, [0.95, 0.92, 0.85]); gl.uniform3fv(U.amb, [0.55, 0.58, 0.65]); gl.uniform3fv(U.cam, eye);
  draw(mesh, o.m || IDM, { nofog: 1, unlit: o.noir ? 1 : 0, tint: o.noir ? [0.05, 0.07, 0.1] : ONE });
  const px = new Uint8Array(S * S * 4); gl.readPixels(0, 0, S, S, gl.RGBA, gl.UNSIGNED_BYTE, px);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, cv.width, cv.height);
  const c2 = document.createElement('canvas'); c2.width = S; c2.height = S; const g = c2.getContext('2d'); const im = g.createImageData(S, S);
  for (let y = 0; y < S; y++) im.data.set(px.subarray((S - 1 - y) * S * 4, (S - y) * S * 4), y * S * 4);
  g.putImageData(im, 0, 0);
  return VIGN[k2] = c2.toDataURL();
}
let HTEX = null;
function imgPoisson(id, noir) { return '<img class="vig" src="' + vignette('f_' + id, fishMesh(id), { noir, dir: [0.15, 0.25, 1], m: M4.Ry(Math.PI / 2) }) + '">'; }
function imgCanne(id) { return '<img class="vig" src="' + vignette('r_' + id, rodMesh(id), { dir: [1, 0.15, 0.25], m: M4.Rz(-0.9) }) + '">'; }
function imgBateau(id) { return '<img class="vig" src="' + vignette('b_' + id, BOATS[id], { dir: [1, 0.55, 0.7] }) + '">'; }

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
  { id: 'recif', nom: '🐠 Récif Perdu', x: 215, z: 215, R: 26, style: 'recif', seed: 4.4 },
  { id: 'prehisto', nom: '🦖 Île Préhistorique', x: 30, z: -360, R: 38, style: 'jungle', seed: 5.2 },
  { id: 'abysses', nom: '🌀 Rocher des Abysses', x: -360, z: 40, R: 18, style: 'rocher', seed: 6.6, reach: 95 },
  { id: 'epave', nom: '', x: 150, z: -62, R: 9, style: 'banc', seed: 7.1, nodock: true, cache: true }
];
const GOUFFRE = { x: 0, z: 0, r: 19, gap: 0 };
for (const I of ILES) {
  const l = Math.hypot(I.x, I.z); I.dx = -I.x / l; I.dz = -I.z / l; // direction vers l'île de départ
  I.px = I.dz; I.pz = -I.dx; // perpendiculaire
  I.ry = Math.atan2(I.dx, I.dz);
  I.vx = I.x + I.dx * (I.R - 11); I.vz = I.z + I.dz * (I.R - 11); // place du village
  I.u0 = I.R - 7; I.u1 = I.R + 15; // ponton
  I.reach = I.reach || I.R + 45;
  if (I.id === 'abysses') { GOUFFRE.x = I.x - I.dx * 58; GOUFFRE.z = I.z - I.dz * 58; GOUFFRE.gap = Math.atan2(I.z - GOUFFRE.z, I.x - GOUFFRE.x); }
}
function angDiff(a, b) { let d = a - b; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return Math.abs(d); }
function dansGouffre(x, z) { return Math.hypot(x - GOUFFRE.x, z - GOUFFRE.z) < GOUFFRE.r; }
function porteGouffre(x, z) { const d = Math.hypot(x - GOUFFRE.x, z - GOUFFRE.z); return d > GOUFFRE.r - 2 && d < GOUFFRE.r + 8 && angDiff(Math.atan2(z - GOUFFRE.z, x - GOUFFRE.x), GOUFFRE.gap) < 0.22; }
function gouffreOuvert() { return !!(ME && ME.quetes && ME.quetes.gouffre); }
function noiseH(x, z) { return Math.sin(x * 0.13) * 1.3 + Math.cos(z * 0.11) * 1.2 + Math.sin((x + z) * 0.27) * 0.5 + Math.cos((x - z) * 0.21) * 0.4; }
function isleH(I, x, z) {
  const dx = x - I.x, dz = z - I.z, a = Math.atan2(dz, dx);
  const d = Math.hypot(dx, dz) * (1 + 0.10 * Math.sin(a * 3 + I.seed) + 0.06 * Math.cos(a * 5 + I.seed * 2));
  let h = 0.2 * (I.R - d) + noiseH(x + I.seed * 50, z) * clamp((I.R - d) / 14, 0, 1);
  if (I.style === 'volcan') { const c = Math.max(0, I.R * 0.62 - d); h += c * 0.95; if (d < 3.5) h -= (3.5 - d) * 2.2; }
  if (I.style === 'marais') { h = h * 0.4 + 0.15; if (h > 0) h -= Math.max(0, Math.sin(x * 0.31) * Math.cos(z * 0.29)) * 1.1; }
  if (I.style === 'recif') h *= 0.65;
  if (I.style === 'jungle') { h += Math.max(0, Math.sin(x * 0.09 + 1) * Math.cos(z * 0.08) * 4) * clamp((I.R - d) / 10, 0, 1); }
  if (I.style === 'rocher') { h = h * 1.6 + Math.abs(Math.sin(x * 0.4) * Math.cos(z * 0.37)) * 4 * clamp((I.R - d) / 6, 0, 1); }
  if (I.style === 'banc') { h = Math.min(h * 0.35 + 0.1, 0.9); }
  if (I.style !== 'volcan' && h > 4) h = 4 + (h - 4) * 0.5;
  if (I.style === 'rocher') { // anneau de rochers du Gouffre
    const rd = Math.hypot(x - GOUFFRE.x, z - GOUFFRE.z);
    if (rd < GOUFFRE.r + 9) {
      const ang = angDiff(Math.atan2(z - GOUFFRE.z, x - GOUFFRE.x), GOUFFRE.gap);
      const ring = clamp(1 - Math.abs(rd - (GOUFFRE.r + 3.5)) / 3.5, 0, 1);
      const pic = 6 + Math.abs(Math.sin(Math.atan2(z - GOUFFRE.z, x - GOUFFRE.x) * 9)) * 7;
      if (ang > 0.22) h = Math.max(h, -8 + ring * (pic + 8));
      if (rd < GOUFFRE.r) h = Math.min(h, -9);
    }
  }
  const dv = I.nodock ? 99 : Math.hypot(x - I.vx, z - I.vz);
  if (dv < 13) { const k = clamp((13 - dv) / 6, 0, 1) * 0.85; h = lerp(h, 1.5, k); }
  return Math.max(h, -8);
}
function H(x, z) {
  if (x * x + z * z < 120 * 120) return startH(x, z);
  let best = -8;
  for (const I of ILES) { const dx = x - I.x, dz = z - I.z; if (dx * dx + dz * dz < I.reach * I.reach) best = Math.max(best, isleH(I, x, z)); }
  return best;
}
function onIsleDock(I, x, z) {
  const dx = x - I.x, dz = z - I.z; const u = dx * I.dx + dz * I.dz, v = dx * I.px + dz * I.pz;
  return (u >= I.u0 && u <= I.u1 && Math.abs(v) <= 1.6) || (u >= I.u1 - 6 && u <= I.u1 && Math.abs(v) <= 4.5);
}
function onDock(x, z) {
  if ((x >= DOCK.x0 && x <= DOCK.x1 && z >= DOCK.z0 && z <= DOCK.z1) || (x >= DOCK.tx0 && x <= DOCK.x1 && z >= DOCK.tz0 && z <= DOCK.tz1)) return true;
  if (x >= 27 && x <= 31.5 && z >= -15 && z <= 15) return true; // promenade en bois
  for (const I of ILES) if (!I.nodock && Math.abs(x - I.x) < I.R + 20 && Math.abs(z - I.z) < I.R + 20 && onIsleDock(I, x, z)) return true;
  return false;
}
function groundY(x, z) { const h = H(x, z); return onDock(x, z) ? Math.max(h, DOCK.y) : h; }
function ileProche(x, z) { for (const I of ILES) if (!I.nodock && Math.hypot(x - I.x, z - I.z) < I.R + 45) return I; return null; }
let MEGA = null; // { x, z, reste, variante }
let KRAKEN = null, ECLIPSE = false, CIN = null;
function waveY(x, z, t) { return Math.sin(x * 0.35 + t * 1.3) * 0.13 + Math.cos(z * 0.3 + t * 1.1) * 0.13 + Math.sin((x + z) * 0.6 + t * 2.0) * 0.04; }
const PATHS = [[[26, 0], [6, 0]], [[6, 0], [-2, -4]], [[6, 0], [8, -13]], [[6, 0], [-6, 8]], [[18, 0], [18, -4]], [[18, 0], [18, 5]]];
function distSeg(px, pz, a, b) { const dx = b[0] - a[0], dz = b[1] - a[1]; const t = clamp(((px - a[0]) * dx + (pz - a[1]) * dz) / (dx * dx + dz * dz), 0, 1); return Math.hypot(px - a[0] - dx * t, pz - a[1] - dz * t); }
function onPath(x, z) { let m = 99; for (const s of PATHS) m = Math.min(m, distSeg(x, z, s[0], s[1])); return m; }
function zoneAt(x, z) {
  if (MEGA && Math.hypot(x - MEGA.x, z - MEGA.z) < 45) return 'mega';
  if (dansGouffre(x, z)) return 'gouffre';
  if (Math.hypot(x - GOUFFRE.x, z - GOUFFRE.z) < 40) return 'abysses';
  const I = ileProche(x, z); if (I) return I.id;
  if (Math.hypot(x - POND[0], z - POND[1]) < 9.5) return 'etang';
  return Math.hypot(x, z) > 52 ? 'large' : 'cote';
}
const NOM_ZONE = { etang: '🌿 Étang', cote: '🏖️ Côte', large: '🌊 Large', braise: '🌋 Île Braise', givre: '❄️ Île Givre', marais: '🌫️ Marais Brumeux', recif: '🐠 Récif Perdu', prehisto: '🦖 Île Préhistorique', mega: '🦈 Territoire du Mégalodon', abysses: '🌀 Rocher des Abysses', gouffre: '🐙 Gouffre du Kraken' };
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
  terrainGrid(b, O, O, N, S, (x, z, h, ny) => { let c = col(x, z, h); if (h > 0.8 && ny < 0.8) c = mixc(c, C.roche, clamp((0.8 - ny) * 3, 0, 0.7)); return c; });
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

  // ---- grande promenade en bois le long de la plage + lanternes suspendues ----
  for (let z = -15; z < 15; z += 1) { if (z >= -2 && z < 2) continue; b.box(29.25, dy - 0.1, z + 0.5, 4.5, 0.2, 0.92, (Math.abs(z) % 2 ? C.boisC : C.bois), 0, true); }
  for (let z = -14; z <= 14; z += 3.5) for (const x of [27.2, 31.3]) b.cyl(x, -3, z, 0.17, 0.17, dy + 3.5, 6, C.boisF);
  for (let z = -15; z < 15; z += 1.5) { if (Math.abs(z + 0.75) < 2.6) continue; b.box(31.45, dy + 0.75, z + 0.75, 0.1, 0.1, 1.5, C.boisF); b.box(31.45, dy + 0.4, z + 0.75, 0.08, 0.7, 0.08, C.boisF); }
  for (const z of [-13, -7, 7, 13]) {
    b.cyl(31.6, dy, z, 0.13, 0.13, 3.6, 6, C.boisF); b.box(32.3, dy + 3.5, z, 1.6, 0.14, 0.14, C.boisF);
    b.box(33, dy + 3.25, z, 0.04, 0.45, 0.04, hex('#222')); b.box(33, dy + 2.95, z, 0.42, 0.08, 0.42, hex('#3a2a1a')); b.box(33, dy + 2.45, z, 0.42, 0.06, 0.42, hex('#3a2a1a'));
    glow.box(33, dy + 2.7, z, 0.34, 0.44, 0.34, hex('#ffd27a'));
  }
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
  // ---- socles des présentoirs de cannes ----
  for (const st of STANDS) { if (st.cache) continue; const y = H(st.x, st.z); b.box(st.x, y + 0.3, st.z, 0.8, 0.9, 0.8, hex('#6e4826'), st.ry, true); b.box(st.x, y + 0.78, st.z, 0.95, 0.08, 0.95, hex('#c8a46a'), st.ry); b.box(st.x, y + 0.84, st.z, 0.5, 0.06, 0.5, hex('#b02a2a'), st.ry); }
  // ---- les 4 braseros des épreuves (un par île, un peu cachés) ----
  for (const id of ['braise', 'givre', 'marais', 'recif']) {
    const I = ILES.find(i => i.id === id); const base = Math.atan2(-I.dz, -I.dx);
    for (let k = 0; k < 60; k++) {
      const a = base + (k % 2 ? 1 : -1) * Math.floor(k / 2) * 0.12, d = I.R * (0.45 + (k % 5) * 0.05);
      const x = I.x + Math.cos(a) * d, z = I.z + Math.sin(a) * d, h = H(x, z);
      if (h < 0.9 || h > 9 || COLLIDERS.some(c => Math.hypot(x - c.x, z - c.z) < c.r + 1.6)) continue;
      b.cyl(x, h - 0.4, z, 0.55, 0.42, 1.6, 8, C.pierreF); b.cyl(x, h + 1.15, z, 0.8, 0.55, 0.4, 8, C.pierre); b.cyl(x, h + 1.5, z, 0.62, 0.62, 0.05, 8, hex('#2a2a2a'));
      for (let q = 0; q < 4; q++) { const aa = q * 1.57 + 0.4; b.box(x + Math.cos(aa) * 0.85, h + 0.2, z + Math.sin(aa) * 0.85, 0.3, 0.8, 0.3, C.pierre, aa, true); }
      FLAMMES_POS[id] = [x, h + 1.55, z]; COLLIDERS.push({ x, z, r: 0.9 }); break;
    }
  }
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
  // ---- ciel, ombre, aileron, porte du gouffre, tentacule, flamme ----
  const ciel = new B(); ciel.sph(0, 0, 0, 1, 1, 1, [1, 1, 1], 16);
  const disque = new B(); for (let k = 0; k < 16; k++) { const a0 = k / 16 * 6.283, a1 = (k + 1) / 16 * 6.283; disque.v(0, 0, 0, 0, 1, 0, [0, 0, 0]); disque.v(Math.cos(a1), 0, Math.sin(a1), 0, 1, 0, [0, 0, 0]); disque.v(Math.cos(a0), 0, Math.sin(a0), 0, 1, 0, [0, 0, 0]); }
  const fin = new B(); const fg = hex('#59646f'); fin.tri([0, 0, 1.6], [0, 3.2, -0.4], [0, 0, -1.6], fg); fin.tri([0, 0, 1.6], [0, 0, -1.6], [0, 3.2, -0.4], fg); fin.box(0, 0.05, 0, 0.5, 0.2, 3.4, fg);
  fin.tri([0, 0, -6], [0, 1.8, -8], [0, 0.1, -7], fg); fin.tri([0, 0, -6], [0, 0.1, -7], [0, 1.8, -8], fg);
  const porte = new B();
  for (let k = -4; k <= 4; k++) { const a = GOUFFRE.gap + k * 0.045, rr = GOUFFRE.r + 3.5; porte.cyl(GOUFFRE.x + Math.cos(a) * rr, -3, GOUFFRE.z + Math.sin(a) * rr, 0.35, 0.35, 11, 6, hex('#9a5aff')); }
  for (const y of [2, 5]) { const a0 = GOUFFRE.gap - 0.2, a1 = GOUFFRE.gap + 0.2, rr = GOUFFRE.r + 3.5; const p0 = [GOUFFRE.x + Math.cos(a0) * rr, GOUFFRE.z + Math.sin(a0) * rr], p1 = [GOUFFRE.x + Math.cos(a1) * rr, GOUFFRE.z + Math.sin(a1) * rr]; porte.box((p0[0] + p1[0]) / 2, y, (p0[1] + p1[1]) / 2, Math.hypot(p1[0] - p0[0], p1[1] - p0[1]), 0.4, 0.4, hex('#c08aff'), Math.atan2(p1[0] - p0[0], p1[1] - p0[1]) + Math.PI / 2); }
  const tent = new B(); for (let k = 0; k < 14; k++) { const r = 1.3 - k * 0.08; tent.sph(Math.sin(k * 0.35) * k * 0.25, k * 0.9, 0, r, 0.6, r, k % 3 ? hex('#5a1a6a') : hex('#c070d0'), 6); }
  const casier = new B(); casier.sph(0, 0.15, 0, 0.32, 0.3, 0.32, hex('#e5484d'), 6); casier.sph(0, -0.05, 0, 0.32, 0.18, 0.32, [1, 1, 1], 6); casier.box(0, 0.6, 0, 0.05, 0.6, 0.05, hex('#333')); casier.box(0, 0.95, 0, 0.3, 0.2, 0.03, hex('#ffe066'));
  for (const sx of [-0.5, 0.5]) for (const sz of [-0.4, 0.4]) casier.box(sx, -1.2, sz, 0.05, 0.8, 0.05, hex('#6e4826')); casier.box(0, -0.8, 0, 1.05, 0.05, 0.85, hex('#6e4826')); casier.box(0, -1.6, 0, 1.05, 0.05, 0.85, hex('#6e4826')); casier.box(0, -0.3, 0, 0.02, 0.9, 0.02, hex('#c8b890'));
  const aile = new B(); aile.tri([0, 0.3, 0.8], [-2.4, 0, -0.6], [2.4, 0, -0.6], hex('#ff5a3a'), true); aile.tri([0, 0.3, 0.8], [2.4, 0, -0.6], [-2.4, 0, -0.6], hex('#ff5a3a')); aile.tri([0, 0.32, 0.6], [-1.2, 0.05, -0.4], [1.2, 0.05, -0.4], hex('#ffe066'), true);
  for (const sx of [-0.3, 0.3]) aile.box(sx, -0.45, 0, 0.03, 0.9, 0.03, hex('#333'));
  const flamme = new B(); flamme.cyl(0, 0, 0, 0.45, 0, 1.4, 6, hex('#ff8a20')); flamme.cyl(0, 0, 0, 0.28, 0, 1.0, 6, hex('#ffe066'), 0.5);
  const requin = v => {
    const b = new B(); const fant = v === 'fantome', anc = v === 'ancien';
    const c = fant ? hex('#d8f6ff') : anc ? hex('#26346e') : hex('#5d6873'), cl = fant ? hex('#ffffff') : anc ? hex('#8a96c8') : hex('#d8dde2'), fonce = fant ? hex('#9fd8ea') : anc ? hex('#141c40') : hex('#3c454e');
    const dent = anc ? hex('#ff2a2a') : hex('#ffffff');
    b.sph(0, 0, 0, 1.7, 1.55, 5.2, c, 10); b.sph(0, -0.55, 0.4, 1.45, 0.95, 4.5, cl, 8);
    b.sph(0, 0.45, 4.7, 1.35, 0.85, 1.7, c, 8); b.sph(0, -1.35, 4.3, 1.15, 0.38, 1.6, cl, 7); b.sph(0, -0.5, 4.95, 1.05, 0.6, 1.0, hex('#4a0810'), 7);
    for (let k = 0; k < 8; k++) { const z = 4.0 + k * 0.22, x = (k % 2 ? 1 : -1) * (0.75 - k * 0.06); b.tri([x - 0.12, -0.05, z], [x + 0.12, -0.05, z], [x, -0.45, z + 0.05], dent); b.tri([x + 0.12, -0.05, z], [x - 0.12, -0.05, z], [x, -0.45, z + 0.05], dent); b.tri([x - 0.1, -1.05, z - 0.2], [x + 0.1, -1.05, z - 0.2], [x, -0.7, z - 0.15], dent); b.tri([x + 0.1, -1.05, z - 0.2], [x - 0.1, -1.05, z - 0.2], [x, -0.7, z - 0.15], dent); }
    for (const s of [-1, 1]) { b.box(s * 0.95, 0.6, 3.9, 0.12, 0.22, 0.22, anc ? hex('#ff3030') : hex('#0a0a0a')); b.tri([s * 1.4, -0.6, 1.5], [s * 3.6, -1.6, -0.6], [s * 1.4, -0.6, -0.4], fonce, true); b.tri([s * 1.4, -0.6, 1.5], [s * 1.4, -0.6, -0.4], [s * 3.6, -1.6, -0.6], fonce); }
    b.tri([0, 1.3, 1.2], [0, 4.0, -1.6], [0, 1.3, -1.6], fonce); b.tri([0, 1.3, 1.2], [0, 1.3, -1.6], [0, 4.0, -1.6], fonce);
    b.tri([0, 0, -4.6], [0, 3.6, -8.0], [0, 0.2, -6.4], fonce); b.tri([0, 0, -4.6], [0, 0.2, -6.4], [0, 3.6, -8.0], fonce); b.tri([0, 0, -4.6], [0, -2.4, -7.4], [0, -0.2, -6.2], fonce); b.tri([0, 0, -4.6], [0, -0.2, -6.2], [0, -2.4, -7.4], fonce);
    if (fant) for (let k = 0; k < 7; k++) { const z = -2.6 + k * 0.85; for (const s of [-1, 1]) b.box(s * 1.45, 0, z, 0.08, 2.2 - Math.abs(k - 3) * 0.2, 0.16, hex('#7fb8d0')); }
    if (anc) for (let k = 0; k < 5; k++) b.tri([0, 1.45, 2.8 - k * 0.6], [0, 2.1, 2.5 - k * 0.6], [0, 1.45, 2.3 - k * 0.6], hex('#ff3030'));
    return b.mesh();
  };
  const goutte = new B(); goutte.box(0, 0, 0, 0.35, 0.35, 0.35, [0.95, 0.98, 1]);
  return { requinN: requin('normal'), requinA: requin('ancien'), requinF: requin('fantome'), goutte: goutte.mesh(), casier: casier.mesh(), aile: aile.mesh(), ciel: ciel.mesh(), ombre: disque.mesh(), aileron: fin.mesh(), porte: porte.mesh(), tentacule: tent.mesh(), flamme: flamme.mesh(), fond: fo.mesh(), terre: b.mesh(), glow: glow.mesh(), eau: w.mesh(), etoiles: st.mesh(gl.POINTS), soleil: sun.mesh(), lune: moon.mesh(), nuages: cl.mesh() };
}

// ---------- construction d'une île ----------
function buildIsle(I, b, glow, rand, lampadaire, shop) {
  const st = I.style;
  const pal = {
    volcan: { sable: hex('#4a4440'), herbe: hex('#5a524c'), herbe2: hex('#3e3834'), haut: hex('#2e2a28'), fond: hex('#3a3634') },
    glace: { sable: hex('#cfd8e0'), herbe: hex('#f2f6fa'), herbe2: hex('#dfe8f0'), haut: hex('#ffffff'), fond: hex('#8aa0b0') },
    marais: { sable: hex('#6a6040'), herbe: hex('#4a6a32'), herbe2: hex('#3a5428'), haut: hex('#56763a'), fond: hex('#3a4a30') },
    recif: { sable: hex('#f6ecd0'), herbe: hex('#7cc456'), herbe2: hex('#63b347'), haut: hex('#8ad060'), fond: hex('#e0d0a0') },
    jungle: { sable: hex('#d8c48a'), herbe: hex('#3f8f2e'), herbe2: hex('#2f7a26'), haut: hex('#4a7a3a'), fond: hex('#a89a70'), roche: hex('#6a6a5a') },
    rocher: { sable: hex('#3a3842'), herbe: hex('#45424e'), herbe2: hex('#383540'), haut: hex('#2a2830'), fond: hex('#2a2a36'), roche: hex('#2e2c34') },
    banc: { sable: hex('#f2e6c4'), herbe: hex('#e8dab0'), herbe2: hex('#e0d0a0'), haut: hex('#e8dab0'), fond: hex('#d8c8a0') }
  }[st];
  if (st === 'banc') { // épave : pas de ponton ni de village
    const P2 = (u, v) => [I.x + u, I.z + v];
    const S2 = 1.2, N2 = Math.ceil((I.R + 12) * 2 / S2), O2 = -N2 * S2 / 2;
    terrainGrid(b, I.x + O2, I.z + O2, N2, S2, (x, z, hm) => hm < 0.1 ? mixc(pal.sable, hex('#16507a'), clamp(-hm / 6, 0, 1)) : pal.sable);
    const by = H(I.x, I.z);
    // vieux bateau échoué, penché
    b.box(I.x + 2, by + 0.4, I.z - 1, 2.2, 1.1, 6, hex('#6a4a2a'), 0.5, true); b.box(I.x + 2, by + 1.0, I.z - 1, 2.0, 0.1, 5.6, hex('#8a6a4a'), 0.5);
    b.cyl(I.x + 2.3, by + 0.9, I.z - 1.4, 0.12, 0.1, 4.2, 6, hex('#5a3a1a')); b.box(I.x + 2.3, by + 3.6, I.z - 1.4, 0.08, 0.08, 2.4, hex('#5a3a1a'), 0.5);
    b.tri([I.x + 2.3, by + 4.9, I.z - 1.4], [I.x + 2.3, by + 1.6, I.z - 1.4], [I.x + 3.5, by + 2.2, I.z + 0.4], hex('#d8ccb0'));
    b.tri([I.x + 2.3, by + 4.9, I.z - 1.4], [I.x + 3.5, by + 2.2, I.z + 0.4], [I.x + 2.3, by + 1.6, I.z - 1.4], hex('#d8ccb0'));
    for (let k = 0; k < 4; k++) b.box(I.x - 3 + k * 0.9, by + 0.15, I.z + 3 - k * 0.4, 0.7, 0.3, 0.7, hex('#7a5a3a'), k, true);
    b.cyl(I.x - 4, by - 0.2, I.z - 3, 0.35, 0.35, 0.9, 7, hex('#6a4a2a'));
    COLLIDERS.push({ x: I.x + 2, z: I.z - 1, r: 2.6 });
    return;
  }
  // terrain
  const S = 1.7, ext = I.style === 'rocher' ? I.R + 85 : I.R + 22, N = Math.ceil(ext * 2 / S), O = -N * S / 2;
  terrainGrid(b, I.x + O, I.z + O, N, S, (x, z, hm, ny) => {
    let col = hm < -2 ? mixc(pal.fond, hex('#16507a'), clamp((-hm - 2) / 4, 0, 1)) : hm < 0.15 ? mixc(pal.sable, pal.fond, clamp(-hm / 4, 0, 1)) : hm < 0.7 ? pal.sable : ((Math.sin(x * 0.7) * Math.cos(z * 0.6) > 0.3) ? pal.herbe2 : pal.herbe);
    if (hm > 5) col = mixc(col, pal.haut, clamp((hm - 5) / 5, 0, 1));
    if (hm > 0.8 && ny < 0.78) col = mixc(col, pal.roche || hex('#77736e'), clamp((0.78 - ny) * 3, 0, 0.75));
    if (st === 'volcan' && hm > 12) col = mixc(col, hex('#8a2a10'), clamp((hm - 12) / 4, 0, 0.7));
    const j2 = 0.96 + rand() * 0.08; return col.map(v => v * j2);
  }, (a, b2, c, d) => a < -8.5 && b2 < -8.5 && c < -8.5 && d < -8.5);
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
  const toit = { volcan: hex('#3a3a3a'), glace: hex('#4a7ab0'), marais: hex('#5a4a2a'), recif: hex('#e09a3a'), jungle: hex('#6a8a3a'), rocher: hex('#3a2a4a') }[st];
  const mur = { volcan: hex('#7a6a5a'), glace: hex('#e8eef4'), marais: hex('#8a7a5a'), recif: hex('#f0e2c0'), jungle: hex('#a08a60'), rocher: hex('#5a5662') }[st];
  shop(h1[0], h1[1], 5, 4, I.ry, toit, mur); shop(h2[0], h2[1], 5, 4, I.ry, toit, mur);
  for (const v of [-3, 3]) { const q = P(I.R - 8, v); lampadaire(q[0], H(q[0], q[1]) - 0.2, q[1]); COLLIDERS.push({ x: q[0], z: q[1], r: 0.3 }); }
  // déco selon le style
  const libre = (x, z) => Math.hypot(x - I.vx, z - I.vz) > 12 && !onIsleDock(I, x, z) && !COLLIDERS.some(c => Math.hypot(x - c.x, z - c.z) < c.r + 2);
  const nb = st === 'recif' ? 30 : st === 'jungle' ? 90 : st === 'rocher' ? 25 : 55;
  for (let k = 0, n = 0; k < 500 && n < nb; k++) {
    const a = rand() * 6.28, d = rand() * I.R, x = I.x + Math.cos(a) * d, z = I.z + Math.sin(a) * d, h = H(x, z);
    if (h < 0.6 || !libre(x, z)) continue;
    if (st === 'volcan' && h > 9) continue;
    if (st === 'rocher' && dansGouffre(x, z)) continue;
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
    } else if (st === 'jungle') { // jungle : grands arbres, fougères, os géants, ruines
      const r = rand();
      if (r < 0.5) { const hh = 4 + rand() * 4; b.cyl(x, h - 0.3, z, 0.55, 0.4, hh, 7, hex('#5a4228')); b.sph(x, h + hh + 1.2, z, 3.2, 1.8, 3.2, hex('#2f7a26'), 6, 0.3); b.sph(x + 1.5, h + hh + 0.2, z - 1, 2.2, 1.4, 2.2, hex('#3f8f2e'), 5, 0.3); COLLIDERS.push({ x, z, r: 0.8 }); }
      else if (r < 0.75) { for (let f = 0; f < 6; f++) { const a2 = f / 6 * 6.28 + rand(); b.tri([x, h + 0.1, z], [x + Math.cos(a2) * 1.4 - Math.sin(a2) * 0.3, h + 0.9, z + Math.sin(a2) * 1.4 + Math.cos(a2) * 0.3], [x + Math.cos(a2) * 1.4 + Math.sin(a2) * 0.3, h + 0.9, z + Math.sin(a2) * 1.4 - Math.cos(a2) * 0.3], hex('#4aa03a'), true); } }
      else if (r < 0.88) { const a2 = rand() * 6.28; for (let k = 0; k < 6; k++) { const ox = Math.cos(a2) * (k - 2.5) * 0.9, oz = Math.sin(a2) * (k - 2.5) * 0.9; b.box(x + ox, h + 1.4, z + oz, 0.25, 3.0 - Math.abs(k - 2.5) * 0.4, 0.25, hex('#ece6d4'), a2); b.box(x + ox, h + 2.9 - Math.abs(k - 2.5) * 0.2, z + oz + 0.6, 0.22, 0.22, 1.4, hex('#ece6d4'), a2); } b.box(x, h + 0.3, z, 0.4, 0.4, 6, hex('#e0dac8'), a2 + Math.PI / 2); COLLIDERS.push({ x, z, r: 1.8 }); }
      else { for (let k = 0; k < 3; k++) b.box(x + k * 1.6 - 1.6, h + 1.2, z, 0.8, 2.4 + rand() * 1.6, 0.8, hex('#8a8a7a'), 0, true); b.box(x, h + 2.9, z, 4.4, 0.5, 1.0, hex('#7a7a6a'), 0, true); COLLIDERS.push({ x, z, r: 2.4 }); }
    } else if (st === 'rocher') { // pics sombres + cristaux
      const s2 = 0.8 + rand() * 1.4; b.cyl(x, h - 0.5, z, s2, 0, s2 * 4, 5, hex('#2a2830'), rand()); if (rand() < 0.5) glow.cyl(x + s2, h, z, 0.25, 0, 1.2, 4, hex('#9a5aff'), rand()); COLLIDERS.push({ x, z, r: s2 * 0.8 });
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
    else if (st === 'marais') { b.cyl(x, -2, z, 0.2, 0.15, 3.5, 5, hex('#4a3a28')); if (rand() < 0.5) b.cyl(x + 1, 0.04, z, 0.6, 0.6, 0.04, 7, hex('#3f7b2a'), rand()); }
    else if (st === 'jungle') { const s2 = 1 + rand() * 2; b.sph(x, 0, z, s2 * 1.3, s2, s2, hex('#6a6a5a'), 5, 0.4); }
    else if (st === 'rocher' && !dansGouffre(x, z) && Math.hypot(x - GOUFFRE.x, z - GOUFFRE.z) > GOUFFRE.r + 10) { const s2 = 1 + rand() * 1.5; b.cyl(x, -3, z, s2, 0, s2 * 4 + 3, 5, hex('#2a2830'), rand()); }
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
  const ane = new B(); { // tête d'âne du Créateur
    const gris = hex('#8f8984'), clair = hex('#c9c1b8'), crin = hex('#3b3430'), noir = hex('#111111'), rose = hex('#e8a8a0');
    ane.box(0, 2.0, -0.02, 0.5, 0.5, 0.5, gris, 0, true); ane.box(0, 1.9, 0.33, 0.38, 0.3, 0.3, clair, 0, true);
    ane.box(-0.08, 1.93, 0.485, 0.06, 0.06, 0.02, noir); ane.box(0.08, 1.93, 0.485, 0.06, 0.06, 0.02, noir); ane.box(0, 1.8, 0.45, 0.24, 0.03, 0.12, hex('#6a5a54'));
    for (const s of [-1, 1]) { ane.box(s * 0.255, 2.08, 0.1, 0.02, 0.1, 0.1, [1, 1, 1]); ane.box(s * 0.265, 2.08, 0.12, 0.02, 0.06, 0.06, noir); ane.box(s * 0.15, 2.5, -0.05, 0.12, 0.5, 0.1, gris, 0, true); ane.box(s * 0.15, 2.5, 0.0, 0.06, 0.38, 0.02, rose); }
    ane.box(0, 2.2, -0.28, 0.1, 0.45, 0.08, crin); ane.box(0, 2.27, 0.2, 0.18, 0.06, 0.12, crin);
  }
  const couronne = new B(); { const or = hex('#ffcc33'); couronne.box(0, 2.38, -0.02, 0.4, 0.12, 0.4, or, 0, true); for (const [x, z] of [[-0.15, -0.15], [0.15, -0.15], [-0.15, 0.15], [0.15, 0.15], [0, 0.17], [0, -0.17], [0.17, 0], [-0.17, 0]]) couronne.box(x, 2.5, z - 0.02, 0.07, 0.14, 0.07, or); couronne.sph(0, 2.47, 0.17, 0.04, 0.04, 0.03, hex('#e5484d'), 4); couronne.sph(0.17, 2.47, -0.02, 0.03, 0.04, 0.04, hex('#2b9be0'), 4); couronne.sph(-0.17, 2.47, -0.02, 0.03, 0.04, 0.04, hex('#3fbf55'), 4); }
  const rod = new B(); rod.box(0, 1.25, 0, 0.05, 2.5, 0.05, [1, 1, 1]); rod.box(0, 0.12, 0, 0.09, 0.32, 0.09, hex('#2a2a2a')); rod.box(0, 0.45, 0.07, 0.1, 0.14, 0.12, hex('#888'));
  const bob = new B(); bob.sph(0, 0.14, 0, 0.25, 0.25, 0.25, hex('#e5484d'), 6); bob.sph(0, -0.08, 0, 0.25, 0.17, 0.25, [1, 1, 1], 6); bob.box(0, 0.45, 0, 0.04, 0.22, 0.04, hex('#222'));
  return { ane: ane.mesh(), couronne: couronne.mesh(), leg: leg.mesh(), body: body.mesh(), arm: arm.mesh(), head: head.mesh(), hat: hat.mesh(), rod: rod.mesh(), bob: bob.mesh() };
}
// ---------- chaque canne a son propre design ----------
const rodMeshes = {};
function rodMesh(id) {
  if (rodMeshes[id]) return rodMeshes[id];
  const b = new B(); const L = 2.5;
  const shaft = (c, r0, r1) => b.cyl(0, 0.3, 0, r0 || 0.035, r1 || 0.02, L - 0.3, 6, c);
  const handle = (c) => { b.cyl(0, 0, 0, 0.055, 0.05, 0.42, 6, c); };
  const reel = (c) => { b.box(0.07, 0.48, 0, 0.1, 0.14, 0.14, c, 0, true); b.cyl(0.13, 0.42, 0, 0.07, 0.07, 0.12, 8, c); };
  const rings = (c, n) => { for (let k = 1; k <= n; k++) b.cyl(0, 0.3 + k * (L - 0.4) / (n + 1), 0, 0.045, 0.045, 0.03, 6, c); };
  switch (id) {
    case 'bambou': handle(hex('#b08a50')); shaft(hex('#d8b878'), 0.045, 0.025); for (let k = 0; k < 6; k++) b.cyl(0, 0.5 + k * 0.35, 0, 0.05 - k * 0.003, 0.05 - k * 0.003, 0.05, 6, hex('#9a7a40')); break;
    case 'pecheur': handle(hex('#c8a070')); shaft(hex('#7a4a2a')); reel(hex('#c8302a')); rings(hex('#ddd'), 4); break;
    case 'carbone': handle(hex('#202020')); shaft(hex('#2a2e34'), 0.03, 0.015); reel(hex('#b0b8c0')); rings(hex('#c0c8d0'), 5); break;
    case 'corail': handle(hex('#ffb0a0')); shaft(hex('#ff6f61')); reel(hex('#ffd0c0')); for (let k = 0; k < 4; k++) { const y = 0.8 + k * 0.4, a = k * 2.1; b.box(Math.cos(a) * 0.08, y, Math.sin(a) * 0.08, 0.04, 0.22, 0.04, hex('#ff9a8a'), a); } b.sph(0, L, 0, 0.07, 0.07, 0.07, hex('#ffd0e0'), 4); break;
    case 'magma': handle(hex('#2a1a14')); shaft(hex('#3a2a24'), 0.045, 0.025); reel(hex('#ff5a1a')); for (let k = 0; k < 6; k++) b.box(0, 0.6 + k * 0.32, 0.03, 0.02, 0.18, 0.02, hex('#ffa030'), 0); b.cyl(0, L - 0.1, 0, 0.07, 0, 0.3, 5, hex('#ff8a20')); break;
    case 'givre': handle(hex('#c8e8ff')); shaft(hex('#9fe0ff'), 0.04, 0.02); reel(hex('#ffffff')); for (let k = 0; k < 5; k++) { const a = k * 1.3; b.cyl(Math.cos(a) * 0.05, 0.7 + k * 0.35, Math.sin(a) * 0.05, 0.04, 0, 0.2, 4, hex('#e0f6ff'), a); } b.cyl(0, L - 0.05, 0, 0.06, 0, 0.3, 4, hex('#ffffff')); break;
    case 'tempete': handle(hex('#3a2a7a')); shaft(hex('#7a6cff')); reel(hex('#ffe066')); for (let k = 0; k < 7; k++) b.box((k % 2 ? 0.04 : -0.04), 0.6 + k * 0.27, 0.035, 0.08, 0.06, 0.02, hex('#ffe066'), 0); break;
    case 'marecage': handle(hex('#4a3a28')); shaft(hex('#4a8a3a')); reel(hex('#6a5a3a')); for (let k = 0; k < 12; k++) { const a = k * 0.9; b.box(Math.cos(a) * 0.045, 0.45 + k * 0.17, Math.sin(a) * 0.045, 0.025, 0.12, 0.025, hex('#2f6a22'), a); } for (let k = 0; k < 3; k++) b.box(0.08, 0.9 + k * 0.5, 0, 0.14, 0.02, 0.08, hex('#5ab04a'), k); break;
    case 'abyssale': handle(hex('#0a1030')); shaft(hex('#202a60')); reel(hex('#40e0ff')); rings(hex('#40e0ff'), 5); b.sph(0, L + 0.05, 0, 0.09, 0.09, 0.09, hex('#60f0ff'), 5); break;
    case 'etoile': handle(hex('#fff2b0')); shaft(hex('#ffe066'), 0.04, 0.02); reel(hex('#ffffff')); rings(hex('#fff8d0'), 5); for (let k = 0; k < 5; k++) { const a = k / 5 * 6.283; b.tri([0, L + 0.1, 0], [Math.cos(a) * 0.22, L + 0.1 + Math.sin(a) * 0.22, 0.01], [Math.cos(a + 0.6) * 0.09, L + 0.1 + Math.sin(a + 0.6) * 0.09, 0.01], hex('#fff04a')); b.tri([0, L + 0.1, 0], [Math.cos(a + 0.6) * 0.09, L + 0.1 + Math.sin(a + 0.6) * 0.09, 0.01], [Math.cos(a) * 0.22, L + 0.1 + Math.sin(a) * 0.22, 0.01], hex('#fff04a')); } break;
    case 'naufrage': handle(hex('#6a5a40')); shaft(hex('#8a7a60'), 0.05, 0.03); for (let k = 0; k < 8; k++) b.cyl(0, 0.5 + k * 0.12, 0, 0.06, 0.06, 0.05, 6, hex('#c8b890')); b.box(0, L - 0.3, 0.09, 0.03, 0.25, 0.03, hex('#555')); b.box(0, L - 0.42, 0.09, 0.16, 0.03, 0.03, hex('#555')); break;
    case 'megalo': handle(hex('#4a525a')); shaft(hex('#7a8590'), 0.05, 0.03); reel(hex('#d8d8d8')); b.cyl(0, L - 0.05, 0, 0.12, 0, 0.35, 3, hex('#f4f0e4')); break;
    case 'ancestrale': handle(hex('#6a6a5a')); shaft(hex('#c8c0a8'), 0.05, 0.03); for (let k = 0; k < 5; k++) b.box(0, 0.7 + k * 0.38, 0.045, 0.06, 0.06, 0.02, hex('#4ad0c0')); b.sph(0, L + 0.05, 0, 0.1, 0.1, 0.1, hex('#4ad0c0'), 5); break;
    case 'krakenrod': handle(hex('#2a0a3a')); shaft(hex('#6a2a8a'), 0.05, 0.03); reel(hex('#c05ad0')); for (let k = 0; k < 6; k++) { const a = k * 1.1; b.sph(Math.cos(a) * 0.05, 0.6 + k * 0.3, Math.sin(a) * 0.05, 0.035, 0.035, 0.035, hex('#e0a0f0'), 3); } for (let k = 0; k < 4; k++) b.box(Math.sin(k) * 0.08, L - 0.1 + k * 0.08, k * 0.04, 0.05, 0.12, 0.05, hex('#8a3aa0'), k); break;
    case 'lane': { // la Canne de Lane : un âne entier, tenu par les pattes arrière, la tête en haut !
      const gris = hex('#8f8984'), clair = hex('#b9b2ab'), ventre = hex('#e2dbd2'), crin = hex('#3b3430'), sabot = hex('#2a2522'), rose = hex('#e8a8a0'), noir = hex('#111111');
      // pattes arrière = poignée + sabots
      for (const s of [-1, 1]) { b.box(s * 0.08, 0.22, 0, 0.1, 0.44, 0.12, gris, 0, true); b.box(s * 0.08, -0.03, 0.01, 0.12, 0.08, 0.15, sabot, 0, true); }
      b.box(0, 0.52, 0, 0.3, 0.24, 0.3, gris, 0, true); // fesses
      b.box(0, 0.55, -0.17, 0.05, 0.05, 0.05, gris); b.box(0, 0.4, -0.2, 0.05, 0.28, 0.05, gris, 0, true); b.box(0, 0.22, -0.2, 0.09, 0.12, 0.09, crin, 0, true); // queue avec touffe
      b.box(0, 1.02, 0.02, 0.36, 0.8, 0.34, gris, 0, true); // gros corps
      b.box(0, 1.0, 0.19, 0.26, 0.62, 0.04, ventre, 0, true); // ventre clair
      for (const s of [-1, 1]) { b.box(s * 0.13, 1.42, 0.22, 0.1, 0.1, 0.34, gris, 0, true); b.box(s * 0.13, 1.42, 0.41, 0.12, 0.12, 0.07, sabot, 0, true); } // pattes avant tendues
      b.box(0, 1.6, 0.06, 0.22, 0.36, 0.22, gris, 0, true); // cou
      b.box(0, 1.62, -0.08, 0.07, 0.52, 0.09, crin, 0, true); // crinière
      b.box(0, 1.94, 0.08, 0.26, 0.34, 0.3, gris, 0, true); // tête
      b.box(0, 1.86, 0.3, 0.22, 0.22, 0.22, clair, 0, true); // museau vers l'avant
      b.box(-0.05, 1.86, 0.415, 0.04, 0.04, 0.02, noir); b.box(0.05, 1.86, 0.415, 0.04, 0.04, 0.02, noir); // naseaux
      b.box(0, 1.77, 0.35, 0.14, 0.03, 0.15, hex('#7a6a64')); // bouche
      for (const s of [-1, 1]) { b.box(s * 0.135, 2.0, 0.14, 0.02, 0.07, 0.07, ventre); b.box(s * 0.145, 2.0, 0.16, 0.02, 0.04, 0.04, noir); } // yeux
      for (const s of [-1, 1]) { b.box(s * 0.08, 2.32, 0.02, 0.08, 0.46, 0.07, gris, 0, true); b.box(s * 0.08, 2.32, 0.06, 0.04, 0.36, 0.02, rose); b.box(s * 0.08, 2.56, 0.02, 0.06, 0.06, 0.05, crin); } // grandes oreilles dressées
      b.box(0, 2.15, 0.02, 0.1, 0.08, 0.12, crin); // toupet
      b.sph(0, 2.45, 0.2, 0.035, 0.035, 0.035, hex('#ffe066'), 4); // anneau doré (la ligne part d'ici)
      break;
    }
    default: handle(hex('#2a2a2a')); shaft(hex('#cccccc'));
  }
  return rodMeshes[id] = b.mesh();
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
Object.assign(player, { vy: 0, air: false, swim: false, rodOut: true, dive: false, oxy: 1, glide: false });
let planeurOn = false, radarOn = false, errants = [], harponT = 0, holdGlide = false;
const F = { st: 'idle', power: 0, pdir: 1, t: 0, bob: [0, 0, 0], from: null, to: null, wait: 0, shakeT: 0, bite: null, reel: null, catchShow: null };

// ---------- réseau ----------
async function api(url, body) {
  try {
    const r = await fetch(url, { method: body ? 'POST' : 'GET', headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(Object.assign({ token: TOKEN }, body)) : undefined });
    const j = await r.json(); if (r.status === 401 && ME) { deconnecte(); $('lmsg').textContent = 'Tu as été déconnecté (ou banni).'; } return j;
  } catch (e) { return { err: 'Connexion perdue…' }; }
}
function deconnecte() { localStorage.removeItem('fs_token'); TOKEN = ''; $('jeu').classList.add('hide'); $('login').classList.remove('hide'); }
function setEtat(e) { if (!e) return; ME = e; for (const c of ME.casiers) c.fin = Date.now() + c.reste; majHUD(); }

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
  $('slot7').classList.toggle('off', !(ME.objets.casier > 0)); $('slot7n').textContent = 'Casier ×' + (ME.objets.casier || 0);
  $('slot8').classList.toggle('off', !ME.objets.planeur); $('slot8').classList.toggle('on', planeurOn);
  $('slot9').classList.toggle('off', !ME.objets.radar); $('slot9').classList.toggle('on', radarOn);
  $('slotAdmin').classList.toggle('hide', !ME.role); $('slotAdminN').textContent = ME.role === 'createur' ? 'Créateur' : 'Admin';
  $('badgeAmis').classList.toggle('hide', !(ME.demandes && ME.demandes.length) && !nbDemandes);
  const q = ME.quete; $('queteHud').classList.toggle('hide', !q);
  if (q) $('queteHud').innerHTML = (q.fini ? '✅ ' : '📜 ') + q.txt + '<br>' + (q.type === 'vendre' ? fmt(q.fait) + ' / ' + fmt(q.n) : q.fait + ' / ' + q.n) + (q.fini ? ' — va voir le Vieux Marin !' : '');
  $('slot1').classList.toggle('on', player.rodOut); $('slot1n').innerHTML = '<span style="font-size:22px">🎣</span><br>' + CMAP[ME.canne].nom.replace(/^Canne (en |du |de la |des |de |d')?/, '');
}
const ICON_METEO = { soleil: '☀️ Soleil', nuageux: '☁️ Nuageux', pluie: '🌧️ Pluie', brouillard: '🌫️ Brouillard' };
function heureNow() { return (worldH + (performance.now() - worldT0) / jourMs * 24) % 24; }
function estJour(h) { return h >= 6 && h < 19; }

function openPanel(titre, html, grand) { $('ptitre').innerHTML = titre; $('pcont').innerHTML = html; $('panel').classList.remove('hide'); $('panel').classList.toggle('grand', !!grand); panelOpen = true; annulerPeche(); }
function closePanel() { $('panel').classList.add('hide'); panelOpen = false; curPanel = null; }
let curPanel = null;
$('pclose').onclick = closePanel;
$('panel').addEventListener('mousedown', e => { if (e.target === $('panel')) closePanel(); });

function rangeBadge(r) { const R = DATA.RARETES[r]; return '<span style="color:' + R.coul + ';font-weight:900">' + R.nom + '</span>'; }
function mutNom(m) { const x = DATA.MUTATIONS.find(q => q.id === m); return x ? '<span style="color:#ffe066">✨ ' + x.nom + '</span> ' : ''; }
function variNom(v) { return v === 'scint' ? '<span class="vari" style="color:#9ff6ff">💎 Scintillant</span> ' : v === 'brillant' ? '<span class="vari" style="color:#ffe066">✨ Brillant</span> ' : ''; }
function emojiPoisson(id) { return { crabe: '🦀', poulpe: '🐙', calmar: '🦑', hippocampe: '🐉', requin: '🦈', megalodon: '🦈', megaancien: '🦈', megafantome: '👻', grandkraken: '🐙', krakenancien: '🐙', baleine: '🐋', axolotl: '🦎', esprit: '👻', dragon: '🐉', clown: '🐠', lune: '🐡' }[id] || '🐟'; }

function panelSac(vente) {
  curPanel = vente ? 'vente' : 'sac';
  const sac = ME.sac.slice().sort((a, b) => b.valeur - a.valeur);
  const total = sac.reduce((s, f) => s + (f.lock ? 0 : f.valeur), 0);
  let h = '<div class="barhaut"><div><b>' + sac.length + ' / ' + DATA.SAC_MAX + '</b> poissons • valeur à vendre : <b style="color:#7dff8a">' + fmt(total) + '</b></div>' +
    (vente ? '<div class="tabs" style="margin:0"><button class="btn vert" data-v="99">💰 Tout vendre</button><button class="btn" data-v="1">≤ Peu communs</button><button class="btn gris" data-v="2">≤ Rares</button></div>' : '<div class="s" style="opacity:.8">Vends tes poissons au 💰 Marchand</div>') + '</div>';
  h += '<div class="s" style="margin:2px 2px 8px;opacity:.75">🔒 = verrouillé, il ne sera jamais vendu. Clique sur le cadenas d\\'un poisson pour le (dé)verrouiller.</div>';
  if (!sac.length) h += '<div class="vide">Ton sac est vide. Va pêcher ! 🎣</div>';
  h += '<div class="fgrid">';
  for (const f of sac) {
    const p = PMAP[f.id], R = DATA.RARETES[p.r];
    h += '<div class="fcard' + (f.vari ? ' ' + f.vari : '') + '" style="--rc:' + R.coul + '">' + imgPoisson(f.id) + '<div class="fn" style="color:' + R.coul + '">' + p.nom + '</div><div class="fs">' + variNom(f.vari) + (f.mut ? mutNom(f.mut) : '') + f.kg + ' kg</div><div class="fv">' + fmt(f.valeur) + '</div>' +
      '<button class="lock" data-l="' + f.uid + '">' + (f.lock ? '🔒' : '🔓') + '</button>' + (vente && !f.lock ? '<button class="btn vert mini" data-u="' + f.uid + '">Vendre</button>' : '') + '</div>';
  }
  h += '</div>';
  openPanel(vente ? '💰 Marchand' : '🎒 Ton sac', h, true);
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
  const ic = { soleil: '☀️', lune: '🌙', pluie: '🌧️', brume: '🌫️', journuit: '🌗', eclipse: '🌑' };
  for (const t of DATA.TOTEMS) h += '<div class="row"><div class="ic">' + ic[t.id] + '</div><div class="info"><div class="t">' + t.nom + '</div><div class="s">' + t.desc + '</div></div><button class="btn vert" data-t="' + t.id + '" ' + (ME.argent < t.prix ? 'disabled' : '') + '>' + fmt(t.prix) + '</button></div>';
  openPanel('🗿 Sanctuaire des Totems', h);
  $('pcont').querySelectorAll('[data-t]').forEach(b => b.onclick = async () => { const r = await api('/api/acheter', { type: 'totem', id: b.dataset.t }); if (r.err) return toast('❌ ' + r.err); setEtat(r.etat); setMonde(r.monde); son('magie'); closePanel(); });
}
const CARNET_ZONES = [['casier', '🦀 Casiers'], ['errant', '🔱 Poissons errants'], ['etang', '🌿 Étang'], ['cote', '🏖️ Côte'], ['large', '🌊 Pleine mer'], ['braise', '🌋 Île Braise'], ['givre', '❄️ Île Givre'], ['marais', '🌫️ Marais Brumeux'], ['recif', '🐠 Récif Perdu'], ['prehisto', '🦖 Île Préhistorique'], ['mega', '🦈 Mégalodon'], ['abysses', '🌀 Rocher des Abysses'], ['gouffre', '🐙 Gouffre du Kraken']];
let carnetZone = 'tous', carnetSel = null;
function panelCarnet() {
  curPanel = 'carnet';
  const mom = { jour: '☀️ Le jour', nuit: '🌙 La nuit', tous: '🕐 Tout le temps' }, met = { soleil: '☀️ Soleil', nuageux: '☁️ Nuageux', pluie: '🌧️ Pluie', brouillard: '🌫️ Brouillard' };
  const zoneVue = z => DATA.POISSONS.some(p => p.zone === z && ME.carnet[p.id]);
  let h = '<div class="carnet"><div class="ctabs"><button class="ctab' + (carnetZone === 'tous' ? ' on' : '') + '" data-z="tous">Tout</button>';
  for (const [z, n] of CARNET_ZONES) h += '<button class="ctab' + (carnetZone === z ? ' on' : '') + '" data-z="' + z + '">' + (zoneVue(z) ? n : '???') + '</button>';
  h += '</div><div class="cmid">';
  const liste = DATA.POISSONS.filter(p => carnetZone === 'tous' || p.zone === carnetZone).sort((a, b) => a.r - b.r);
  h += '<div class="ctitre">Carnet [' + (carnetZone === 'tous' ? 'Tout' : (zoneVue(carnetZone) ? CARNET_ZONES.find(q => q[0] === carnetZone)[1] : '???')) + ']</div><div class="fgrid">';
  for (const p of liste) {
    const c = ME.carnet[p.id], R = DATA.RARETES[p.r];
    h += '<div class="fcard sel' + (carnetSel === p.id ? ' on' : '') + '" data-f="' + p.id + '" style="--rc:' + (c ? R.coul : '#445') + '">' + imgPoisson(p.id, !c) + '<div class="fn" style="color:' + (c ? R.coul : '#889') + '">' + (c ? p.nom : '???') + '</div></div>';
  }
  const tot = liste.length, vus = liste.filter(p => ME.carnet[p.id]).length;
  const nb = liste.filter(p => ME.carnet[p.id] && ME.carnet[p.id].b).length, ns = liste.filter(p => ME.carnet[p.id] && ME.carnet[p.id].s).length;
  h += '</div><div class="cbas">' + Math.round(vus / Math.max(1, tot) * 100) + '% complété • ' + vus + ' / ' + tot + ' poissons <span style="float:right"><span style="color:#ffe066">✨ ' + Math.round(nb / Math.max(1, tot) * 100) + '% Brillant</span> • <span style="color:#9ff6ff">💎 ' + Math.round(ns / Math.max(1, tot) * 100) + '% Scintillant</span></span></div></div><div class="cinfo">';
  const p = carnetSel && PMAP[carnetSel];
  if (!p) h += '<div class="vide">Clique sur un poisson pour voir ses infos</div>';
  else {
    const c = ME.carnet[p.id], R = DATA.RARETES[p.r];
    h += imgPoisson(p.id, !c).replace('class="vig"', 'class="vig grand"') + '<div class="fn" style="font-size:20px;color:' + (c ? R.coul : '#889') + '">' + (c ? p.nom : '???') + '</div><div class="s" style="color:' + R.coul + ';font-weight:900">' + R.nom + '</div>';
    h += '<div class="lig">📍 ' + (CARNET_ZONES.find(q => q[0] === p.zone) || ['', '?'])[1] + '</div><div class="lig">' + mom[p.moment] + '</div><div class="lig">' + (p.meteo ? met[p.meteo] : '🌤️ Toutes les météos') + '</div>';
    if (c) h += '<div class="lig">🎣 Attrapé ×' + c.n + (c.b ? ' • ✨' + c.b : '') + (c.s ? ' • 💎' + c.s : '') + '</div><div class="lig">🏆 Record : ' + c.max + ' kg</div><div class="lig">⚖️ ' + p.kg[0] + ' – ' + p.kg[1] + ' kg</div><div class="lig">💰 ' + p.prix + ' $ / kg</div>';
    else h += '<div class="lig" style="opacity:.7">Attrape-le pour en savoir plus !</div>';
  }
  h += '</div></div>';
  openPanel('📖 Carnet des poissons', h, true);
  $('pcont').querySelectorAll('[data-z]').forEach(b => b.onclick = () => { carnetZone = b.dataset.z; carnetSel = null; panelCarnet(); });
  $('pcont').querySelectorAll('[data-f]').forEach(b => b.onclick = () => { carnetSel = b.dataset.f; panelCarnet(); });
}
function panelBateaux(spawn) {
  curPanel = 'bateaux';
  const desc = { barque: 'Rame tranquillement sur les vagues.', moteur: 'Un petit moteur et une cabine pour partir loin.', vedette: 'Fend les vagues à toute vitesse !', yacht: 'Le grand luxe sur l\\'océan.' };
  const acc = { barque: 4, moteur: 6, vedette: 8, yacht: 5 };
  let h = '<div class="s" style="margin:0 2px 10px;opacity:.85">Clique sur [Mettre à l\\'eau], approche-toi du bateau et appuie sur E pour monter.</div><div class="bgrid">';
  for (const bt of DATA.BATEAUX) {
    const a = ME.bateaux.includes(bt.id);
    h += '<div class="bcard">' + imgBateau(bt.id) + '<div class="binfo"><div class="bn">' + bt.nom + (a ? ' <span style="color:#7dff8a">✔</span>' : '') + '</div><div class="bd">' + desc[bt.id] + '</div>' +
      '<div class="bs">⏩ Vitesse : ' + bt.vitesse * 8 + ' n/s</div><div class="bs">⟳ Virage : ' + Math.round(bt.virage * 50) + '°</div><div class="bs">■ Accélération : ' + acc[bt.id] + ' n/s²</div>' +
      (a ? '<button class="btn vert large" data-sp="' + bt.id + '">⚓ [Mettre à l\\'eau]</button>' : '<button class="btn jaune large" data-buy="' + bt.id + '" ' + (ME.argent < bt.prix ? 'disabled' : '') + '>Acheter • ' + fmt(bt.prix) + '</button>') + '</div></div>';
  }
  h += '</div>';
  openPanel('⚓ Bateaux', h, true);
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
  const cvs = $('carte'), g = cvs.getContext('2d'), sc = 560 / 860, X = x => 280 + x * sc, Z = z => 280 + z * sc;
  g.fillStyle = '#2a86c0'; for (let i = 0; i < 40; i++) { g.globalAlpha = 0.15; g.beginPath(); g.arc(Math.random() * 560, Math.random() * 560, 20 + Math.random() * 40, 0, 7); g.fill(); } g.globalAlpha = 1;
  const ile = (x, z, r, c, nom) => { g.fillStyle = '#e9d49b'; g.beginPath(); g.arc(X(x), Z(z), r * sc + 4, 0, 7); g.fill(); g.fillStyle = c; g.beginPath(); g.arc(X(x), Z(z), r * sc, 0, 7); g.fill(); g.fillStyle = '#fff'; g.font = 'bold 15px sans-serif'; g.textAlign = 'center'; g.strokeStyle = '#0008'; g.lineWidth = 4; g.strokeText(nom, X(x), Z(z) - r * sc - 10); g.fillText(nom, X(x), Z(z) - r * sc - 10); };
  ile(0, 0, 34, '#63b347', '🏝️ Île de Départ');
  for (const I of ILES) if (!I.cache) ile(I.x, I.z, I.R, { volcan: '#4a4440', glace: '#f2f6fa', marais: '#4a6a32', recif: '#7cc456', jungle: '#2f7a26', rocher: '#3a3842' }[I.style], I.nom);
  g.strokeStyle = '#9a5aff'; g.lineWidth = 3; g.beginPath(); g.arc(X(GOUFFRE.x), Z(GOUFFRE.z), GOUFFRE.r * sc + 3, 0, 7); g.stroke();
  if (MEGA) { g.font = '20px sans-serif'; g.fillText('🦈', X(MEGA.x), Z(MEGA.z) + 7); }
  if (myBoat) { g.font = '22px sans-serif'; g.fillText('⛵', X(myBoat.x), Z(myBoat.z) + 8); }
  g.fillStyle = '#ff3040'; g.strokeStyle = '#fff'; g.lineWidth = 3; g.beginPath(); g.arc(X(player.x), Z(player.z), 7, 0, 7); g.fill(); g.stroke();
}
function panelCanneStand(id) {
  curPanel = 'stand';
  const c = CMAP[id], a = ME.cannes.includes(id), eq = ME.canne === id;
  let h = '<div class="row"><div class="ic">🎣</div><div class="info"><div class="t"><span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:' + c.coul + ';border:2px solid #fff;margin-right:6px"></span>' + c.nom + (ME.enchants[id] ? ' <span style="color:#ffe066">✨ ' + EMAPC[ME.enchants[id]].nom + '</span>' : '') + '</div>' +
    '<div class="s"><span class="stat">Vitesse ' + barre(c.lure - 0.9, 1.2, '#5fe0ff') + '</span><span class="stat">Contrôle ' + barre(c.control - 0.17, 0.21, '#7dff8a') + '</span><span class="stat">Force ' + barre(c.resil + 3, 53, '#ff8a20') + '</span><span class="stat">Chance ' + barre(c.chance + 5, 185, '#ffe066') + '</span></div>' +
    (c.comment ? '<div class="s" style="margin-top:4px;color:#ffe066">' + c.comment + '</div>' : '') + '</div></div>';
  const bloque = ME.niv < c.niv, cond = c.condition === 'megalodon' && !ME.carnet.megalodon;
  h += '<div style="text-align:center;margin:14px">' + (eq ? '<button class="btn gris" disabled>✔ Équipée</button>' : a ? '<button class="btn" id="bEq">Équiper</button>' : cond ? '<button class="btn gris" disabled>🦈 Attrape d\\'abord un Mégalodon</button>' : bloque ? '<button class="btn gris" disabled>🔒 Niveau ' + c.niv + '</button>' : '<button class="btn vert" id="bBuy" ' + (ME.argent < c.prix ? 'disabled' : '') + ' style="font-size:19px;padding:14px 26px">Acheter ' + fmt(c.prix) + '</button>') + '</div>';
  openPanel('🎣 ' + c.nom, h);
  if ($('bBuy')) $('bBuy').onclick = async () => { const r = await api('/api/acheter', { type: 'canne', id }); if (r.err) return toast('❌ ' + r.err); setEtat(r.etat); son('cash'); toast('🎉 Nouvelle canne : ' + c.nom + ' !'); panelCanneStand(id); };
  if ($('bEq')) $('bEq').onclick = async () => { const r = await api('/api/equiper', { type: 'canne', id }); setEtat(r.etat); panelCanneStand(id); };
}
async function ramasser() { const r = await api('/api/ramasser', { id: 'naufrage' }); if (r.err) return toast('❌ ' + r.err); setEtat(r.etat); son('magie'); toast('🧭 Tu as trouvé une canne secrète : la <b>Canne du Naufragé</b> ! Équipe-la avec la touche C.', 6000); }
async function allumer(id) { const r = await api('/api/flamme', { id }); if (r.err) return toast('❌ ' + r.err); setEtat(r.etat); son('magie'); toast('🔥 Flamme Ancienne allumée ! (' + r.n + '/4)', 4000); }
let invOnglet = 'cannes';
function panelMesCannes() {
  curPanel = 'mescannes';
  const tabs = '<div class="tabs"><button class="btn ' + (invOnglet === 'cannes' ? 'jaune' : 'gris') + '" data-o="cannes">🎣 Cannes</button><button class="btn ' + (invOnglet === 'appats' ? 'jaune' : 'gris') + '" data-o="appats">🪱 Appâts</button></div>';
  let h = tabs;
  if (invOnglet === 'cannes') {
    h += '<div class="s" style="margin:0 2px 8px;opacity:.8">' + ME.cannes.length + ' / ' + DATA.CANNES.length + ' cannes débloquées</div><div class="rgrid">';
    const ordre = ME.cannes.slice().sort((a, b) => (b === ME.canne) - (a === ME.canne) || CMAP[b].chance - CMAP[a].chance);
    for (const id of ordre) {
      const c = CMAP[id], e = ME.enchants[id] ? EMAPC[ME.enchants[id]] : null, eq = ME.canne === id;
      h += '<div class="rcard' + (eq ? ' on' : '') + '"><div class="rstats">' +
        '<div>Vitesse de leurre : ' + Math.round(c.lure * 100) + '%</div><div>Chance : ' + c.chance + '%</div><div>Contrôle : ' + c.control.toFixed(2) + '</div><div>Force : ' + c.resil + '%</div><div>Pris : ' + ((ME.prisesCanne || {})[id] || 0) + '</div></div>' +
        imgCanne(id) + (e ? '<div class="ren">✨ ' + e.nom + ' ✨</div>' : '') + '<div class="rn">[' + c.nom + ']</div>' +
        (eq ? '<button class="btn gris large" disabled>✔ Équipée</button>' : '<button class="btn vert large" data-eq="' + id + '">[Équiper]</button>') + '</div>';
    }
    h += '</div>';
  } else {
    h += '<div class="rgrid">';
    for (const a of DATA.APPATS) {
      const n = ME.appats[a.id] || 0, eq = ME.appat === a.id; if (!n) continue;
      h += '<div class="rcard' + (eq ? ' on' : '') + '"><div class="rstats"><div>' + a.desc + '</div>' + (a.chance ? '<div>Chance : +' + a.chance + '</div>' : '') + (a.lure ? '<div>Vitesse : +' + Math.round(a.lure * 100) + '%</div>' : '') + '</div><div style="font-size:54px;margin:10px 0">🪱</div><div class="rn">[' + a.nom + '] ×' + n + '</div>' +
        (eq ? '<button class="btn gris large" data-ea="">Enlever</button>' : '<button class="btn vert large" data-ea="' + a.id + '">[Équiper]</button>') + '</div>';
    }
    if (!Object.keys(ME.appats).length) h += '<div class="vide">Tu n\\'as pas d\\'appâts. Achète-en au stand 🪱 Appâts !</div>';
    h += '</div>';
  }
  openPanel('🧰 Inventaire', h, true);
  $('pcont').querySelectorAll('[data-o]').forEach(b => b.onclick = () => { invOnglet = b.dataset.o; panelMesCannes(); });
  $('pcont').querySelectorAll('[data-eq]').forEach(b => b.onclick = async () => { const r = await api('/api/equiper', { type: 'canne', id: b.dataset.eq }); setEtat(r.etat); panelMesCannes(); });
  $('pcont').querySelectorAll('[data-ea]').forEach(b => b.onclick = async () => { const r = await api('/api/equiper', { type: 'appat', id: b.dataset.ea }); setEtat(r.etat); panelMesCannes(); });
}
function panelGardien() {
  curPanel = 'gardien';
  const q = ME.quetes; const ok = v => v ? '✅' : '⬜';
  let h = '<div class="s" style="margin:0 2px 10px;opacity:.9">« Voyageur… Le Kraken dort au fond du Gouffre, derrière la porte scellée. Prouve ta valeur en réussissant mes 3 épreuves, et je l\\'ouvrirai pour toi. »</div>';
  const a = DATA.OFFRANDE.map(id => (ME.sac.some(f => f.id === id) ? '✔ ' : '✖ ') + PMAP[id].nom).join(' • ');
  h += '<div class="row"><div class="ic">' + ok(q.offrande) + '</div><div class="info"><div class="t">Épreuve 1 : L\\'Offrande</div><div class="s">Apporte-moi ces 3 poissons : ' + a + '</div></div>' + (q.offrande ? '' : '<button class="btn jaune" id="bOff">Donner</button>') + '</div>';
  const fl = { braise: '🌋 Braise', givre: '❄️ Givre', marais: '🌫️ Marais', recif: '🐠 Récif' };
  h += '<div class="row"><div class="ic">' + ok(q.flammes.length >= 4) + '</div><div class="info"><div class="t">Épreuve 2 : Les Quatre Flammes (' + q.flammes.length + '/4)</div><div class="s">Allume la Flamme Ancienne cachée sur chaque île : ' + Object.keys(fl).map(k => (q.flammes.includes(k) ? '🔥 ' : '⚫ ') + fl[k]).join(' • ') + '</div></div></div>';
  h += '<div class="row"><div class="ic">' + ok(q.chant) + '</div><div class="info"><div class="t">Épreuve 3 : Le Chant des Profondeurs</div><div class="s">Attrape un poisson près du Rocher des Abysses, PENDANT LA NUIT.</div></div></div>';
  h += '<div class="row"><div class="ic">' + (q.gouffre ? '🌀' : '🔒') + '</div><div class="info"><div class="t">Récompense</div><div class="s">' + (q.gouffre ? 'Le Gouffre est OUVERT ! Le Kraken sort la nuit… Tu as reçu la Canne Ancestrale.' : 'La Canne Ancestrale + l\\'ouverture du Gouffre du Kraken.') + '</div></div></div>';
  openPanel('🗿 Le Gardien des Abysses', h);
  if ($('bOff')) $('bOff').onclick = async () => { const r = await api('/api/offrande', {}); if (r.err) return toast('❌ ' + r.err); setEtat(r.etat); son('magie'); toast('🗿 « Offrande acceptée. »'); panelGardien(); };
}
function panelQuete() {
  curPanel = 'quete';
  const q = ME.quete;
  let h = '<div class="s" style="margin:0 2px 10px;opacity:.9">« Ahoy matelot ! J\\'ai toujours du travail pour un bon pêcheur. Fais ce que je te demande et je te paierai bien. »</div>';
  if (!q) h += '<div style="text-align:center;margin:20px"><button class="btn jaune" id="bPrendre" style="font-size:19px;padding:14px 26px">📜 Prendre une quête</button></div>';
  else {
    h += '<div class="row"><div class="ic">' + (q.fini ? '✅' : '📜') + '</div><div class="info"><div class="t">' + q.txt + '</div><div class="s">Progression : ' + (q.type === 'vendre' ? fmt(q.fait) + ' / ' + fmt(q.n) : q.fait + ' / ' + q.n) + ' • Récompense : <b style="color:#7dff8a">' + fmt(q.gain) + '</b> + XP + surprise</div></div></div>';
    h += '<div style="text-align:center;margin:14px">' + (q.fini ? '<button class="btn vert" id="bRendre" style="font-size:19px;padding:14px 26px">🎁 Récupérer la récompense</button>' : '<button class="btn gris" id="bAband">Abandonner</button>') + '</div>';
  }
  openPanel('📜 Vieux Marin', h);
  if ($('bPrendre')) $('bPrendre').onclick = async () => { const r = await api('/api/quete', { action: 'prendre' }); if (r.err) return toast('❌ ' + r.err); setEtat(r.etat); son('magie'); panelQuete(); };
  if ($('bRendre')) $('bRendre').onclick = async () => { const r = await api('/api/quete', { action: 'rendre' }); if (r.err) return toast('❌ ' + r.err); setEtat(r.etat); son('cash'); toast('🎁 Quête réussie ! +' + fmt(r.gain) + r.bonus, 4500); panelQuete(); };
  if ($('bAband')) $('bAband').onclick = async () => { const r = await api('/api/quete', { action: 'abandonner' }); setEtat(r.etat); panelQuete(); };
}
function panelBazar() {
  curPanel = 'bazar';
  const ic = { casier: '🦀', planeur: '🪂', plongee: '🤿', harpon: '🔱', radar: '📡' };
  let h = '<div class="rgrid">';
  for (const o of DATA.OBJETS) {
    const a = ME.objets[o.id];
    h += '<div class="rcard"><div style="font-size:60px;margin:6px 0">' + ic[o.id] + '</div><div class="rn">[' + o.nom + ']' + (o.stack ? ' ×' + (a || 0) : a ? ' ✔' : '') + '</div><div class="s" style="margin:6px 0;min-height:48px">' + o.desc + '</div>' +
      (o.stack ? '<button class="btn jaune large" data-o="' + o.id + '" data-n="1" ' + (ME.argent < o.prix ? 'disabled' : '') + '>Acheter 1 • ' + fmt(o.prix) + '</button><button class="btn jaune large" data-o="' + o.id + '" data-n="5" ' + (ME.argent < o.prix * 5 ? 'disabled' : '') + '>Acheter 5 • ' + fmt(o.prix * 5) + '</button>'
        : a ? '<button class="btn gris large" disabled>✔ Possédé</button>' : '<button class="btn jaune large" data-o="' + o.id + '" data-n="1" ' + (ME.argent < o.prix ? 'disabled' : '') + '>Acheter • ' + fmt(o.prix) + '</button>') + '</div>';
  }
  h += '</div>';
  openPanel('🧰 Quincaillier', h, true);
  $('pcont').querySelectorAll('[data-o]').forEach(b => b.onclick = async () => { const r = await api('/api/acheter', { type: 'objet', id: b.dataset.o, n: +b.dataset.n }); if (r.err) return toast('❌ ' + r.err); setEtat(r.etat); son('cash'); panelBazar(); });
}
async function panelAmis() {
  curPanel = 'amis';
  const r = await api('/api/amis', { action: 'liste' }); if (r.err) return toast('❌ ' + r.err); setEtat(r.etat); nbDemandes = (r.demandes || []).length; majHUD();
  let h = '<div class="arow"><input class="ain" id="amiNom" placeholder="Pseudo de ton ami" maxlength="16"><button class="btn vert" id="bAmiAdd">➕ Ajouter</button></div>';
  h += '<div class="s" style="opacity:.8;margin:2px">🌐 Tu es sur le serveur ' + (r.monSrv || '?') + ' (' + r.max + ' joueurs max par serveur)</div>';
  if (r.demandes.length) { h += '<div class="t" style="font-weight:900;margin:10px 2px 4px">📨 Demandes d\\'amis</div>'; for (const n of r.demandes) h += '<div class="row"><div class="ic">👤</div><div class="info"><div class="t">' + n + '</div></div><button class="btn vert" data-acc="' + n + '">Accepter</button><button class="btn rouge" data-ref="' + n + '">Refuser</button></div>'; }
  h += '<div class="t" style="font-weight:900;margin:10px 2px 4px">👥 Mes amis (' + r.liste.length + ')</div>';
  if (!r.liste.length) h += '<div class="vide">Tu n\\'as pas encore d\\'amis. Ajoute-les avec leur pseudo !</div>';
  for (const a of r.liste.sort((x, y) => y.enLigne - x.enLigne)) {
    h += '<div class="row"><div class="ic">' + (a.enLigne ? '🟢' : '⚫') + '</div><div class="info"><div class="t">' + a.nom + '</div><div class="s">Niveau ' + a.niv + ' • ' + (a.enLigne ? 'En ligne • serveur ' + a.srv + ' (' + a.n + '/' + r.max + ')' : 'Hors ligne') + '</div></div>' +
      (a.enLigne && a.srv !== r.monSrv ? (a.n < r.max ? '<button class="btn jaune" data-join="' + a.srv + '">🌐 Rejoindre</button>' : '<button class="btn gris" disabled>Serveur plein</button>') : a.enLigne ? '<span class="s">Même serveur ✔</span>' : '') +
      '<button class="btn gris" data-ret="' + a.nom + '">✖</button></div>';
  }
  openPanel('👥 Amis', h);
  $('bAmiAdd').onclick = async () => { const r2 = await api('/api/amis', { action: 'demander', nom: $('amiNom').value }); if (r2.err) return toast('❌ ' + r2.err); toast('📨 ' + r2.ok); panelAmis(); };
  $('pcont').querySelectorAll('[data-acc]').forEach(b => b.onclick = async () => { await api('/api/amis', { action: 'accepter', nom: b.dataset.acc }); toast('🤝 Vous êtes maintenant amis !'); panelAmis(); });
  $('pcont').querySelectorAll('[data-ref]').forEach(b => b.onclick = async () => { await api('/api/amis', { action: 'refuser', nom: b.dataset.ref }); panelAmis(); });
  $('pcont').querySelectorAll('[data-ret]').forEach(b => b.onclick = async () => { await api('/api/amis', { action: 'retirer', nom: b.dataset.ret }); panelAmis(); });
  $('pcont').querySelectorAll('[data-join]').forEach(b => b.onclick = () => { wantSrv = +b.dataset.join; closePanel(); toast('🌐 Connexion au serveur ' + wantSrv + '…'); });
}
let adminOnglet = 'monde', adminQ = '', confirmSuppr = null;
async function adm(action, o) { const r = await api('/api/admin', Object.assign({ action }, o || {})); if (r.err) { toast('❌ ' + r.err); return null; } if (r.etat) setEtat(r.etat); if (r.monde) setMonde(r.monde); son('magie'); return r; }
async function panelAdmin() {
  if (!ME.role) return;
  curPanel = 'admin'; const C = ME.role === 'createur';
  const tabs = '<div class="tabs">' + [['monde', '🌍 Monde'], ['joueurs', '👥 Joueurs'], ['moi', C ? '👑 Moi' : '🛡️ Moi']].map(([k, n]) => '<button class="btn ' + (adminOnglet === k ? 'jaune' : 'gris') + '" data-tab="' + k + '">' + n + '</button>').join('') + '</div>';
  let h = tabs;
  if (adminOnglet === 'monde') {
    h += '<div class="t" style="font-weight:900">☁️ Météo</div><div class="arow">' + [['soleil', '☀️ Soleil'], ['nuageux', '☁️ Nuageux'], ['pluie', '🌧️ Pluie'], ['brouillard', '🌫️ Brouillard']].map(([k, n]) => '<button class="btn" data-met="' + k + '">' + n + '</button>').join('') + '</div>';
    h += '<div class="t" style="font-weight:900">🕐 Heure</div><div class="arow">' + [[7, '🌅 Matin'], [12, '☀️ Midi'], [18.3, '🌇 Soir'], [22, '🌙 Nuit'], [2, '🌑 Minuit']].map(([k, n]) => '<button class="btn" data-h="' + k + '">' + n + '</button>').join('') + '</div>';
    h += '<div class="t" style="font-weight:900">🦈 Mégalodon</div><div class="arow"><button class="btn jaune" data-mega="1" data-var="normal">🦈 Mégalodon</button><button class="btn jaune" data-mega="1" data-var="ancien">🦈 Mégalodon Ancien</button><button class="btn jaune" data-mega="1" data-var="fantome">👻 Mégalodon Fantôme</button><button class="btn gris" data-mega="0">Faire partir</button></div>';
    h += '<div class="t" style="font-weight:900">🐙 Kraken</div><div class="arow"><button class="btn jaune" data-krak="1" data-var="normal">🐙 Kraken</button><button class="btn jaune" data-krak="1" data-var="ancien">🐙🔥 Kraken Ancien</button><button class="btn gris" data-krak="0">Faire partir</button></div>';
    h += '<div class="t" style="font-weight:900">🌑 Éclipse</div><div class="arow"><button class="btn" data-ecl="1">Lancer une éclipse</button><button class="btn gris" data-ecl="0">Arrêter l\\'éclipse</button></div>';
    h += '<div class="t" style="font-weight:900">🍀 Boost de chance pour tout le serveur</div><div class="arow">' + [[2, 5], [3, 10], [5, 10], [10, 5]].map(([m, mi]) => '<button class="btn vert" data-boost="' + m + '" data-min="' + mi + '">×' + m + ' • ' + mi + ' min</button>').join('') + '</div>';
    h += '<div class="t" style="font-weight:900">📢 Annonce à tout le monde</div><div class="arow"><input class="ain" id="annTxt" maxlength="140" placeholder="Ton message…" style="flex:1"><button class="btn jaune" id="bAnn">Envoyer</button></div>';
  } else if (adminOnglet === 'joueurs') {
    const r = await api('/api/admin', { action: 'joueurs', q: adminQ }); if (r.err) return toast('❌ ' + r.err);
    h += '<div class="arow"><input class="ain" id="admQ" placeholder="Chercher un pseudo" value="' + adminQ.replace(/"/g, '') + '" style="flex:1"><button class="btn" id="bAdmQ">🔍</button></div><div class="s" style="opacity:.8">' + r.total + ' comptes</div>';
    for (const j of r.liste) {
      const moi = j.nom === ME.nom, prot = j.role === 'createur' || (j.role === 'admin' && !C);
      h += '<div class="row" style="flex-wrap:wrap"><div class="ic">' + (j.enLigne ? '🟢' : '⚫') + '</div><div class="info"><div class="t">' + (j.role === 'createur' ? '👑 ' : j.role === 'admin' ? '🛡️ ' : '') + j.nom + '</div><div class="s">Niv. ' + j.niv + ' • ' + fmt(j.argent) + (j.enLigne ? ' • serveur ' + j.srv : '') + (j.ban ? '<br><b style="color:#ff8a8a">' + j.ban + '</b>' : '') + '</div></div>';
      if (!moi) {
        h += '<div class="arow" style="width:100%">';
        if (j.enLigne) h += '<button class="btn" data-join="' + j.srv + '">🌐 Aller sur son serveur</button>';
        if (!prot) h += j.ban ? '<button class="btn vert" data-deban="' + j.nom + '">✅ Débannir</button>' : '<button class="btn rouge" data-ban="' + j.nom + '" data-min="60">⛔ 1 h</button><button class="btn rouge" data-ban="' + j.nom + '" data-min="1440">⛔ 1 jour</button><button class="btn rouge" data-ban="' + j.nom + '" data-min="10080">⛔ 7 jours</button>' + (C ? '<button class="btn rouge" data-ban="' + j.nom + '" data-min="0">⛔ DÉFINITIF</button>' : '');
        if (C) h += '<button class="btn jaune" data-arg="' + j.nom + '">💰 +10 000</button><button class="btn" data-lane="' + j.nom + '">🫏 Donner Canne de Lane</button>' + (j.role === 'admin' ? '<button class="btn gris" data-adm="' + j.nom + '" data-v="0">Retirer admin</button>' : '<button class="btn" data-adm="' + j.nom + '" data-v="1">🛡️ Rendre admin</button>') +
          '<button class="btn rouge" data-sup="' + j.nom + '">' + (confirmSuppr === j.nom ? '⚠️ Sûr ? Re-clique pour SUPPRIMER' : '🗑️ Supprimer le compte') + '</button>';
        h += '</div>';
      }
      h += '</div>';
    }
  } else {
    h += '<div class="t" style="font-weight:900">✈️ Pouvoirs</div><div class="arow"><button class="btn ' + (volOn ? 'jaune' : '') + '" id="bVol">' + (volOn ? '✈️ Vol : ACTIVÉ' : '✈️ Voler') + '</button></div><div class="s" style="opacity:.8">En vol : ZQSD pour avancer, ESPACE pour monter, Shift pour descendre.</div>';
    h += '<div class="t" style="font-weight:900;margin-top:8px">📍 Téléportation</div><div class="arow"><button class="btn" data-tp="0,0">🏝️ Départ</button>' + ILES.filter(I => !I.cache).map(I => '<button class="btn" data-tp="' + Math.round(I.vx) + ',' + Math.round(I.vz) + '">' + I.nom + '</button>').join('') + '<button class="btn" data-tp="' + Math.round(GOUFFRE.x) + ',' + Math.round(GOUFFRE.z) + '">🐙 Gouffre</button>' + (MEGA ? '<button class="btn jaune" data-tp="' + Math.round(MEGA.x) + ',' + Math.round(MEGA.z) + '">🦈 Mégalodon</button>' : '') + '</div>';
    if (C) {
      h += '<div class="t" style="font-weight:900;margin-top:8px">👑 Créateur</div><div class="arow"><button class="btn jaune" data-moi="argent" data-v="100000">💰 +100 000 $</button><button class="btn jaune" data-moi="argent" data-v="1000000">💰 +1 000 000 $</button><button class="btn" data-moi="niveau" data-v="50">⭐ Niveau 50</button></div>';
      h += '<div class="arow"><button class="btn vert" data-moi="canne" data-v="lane">🫏 Canne de Lane</button><button class="btn" data-moi="canne" data-v="toutes">🎣 Toutes les cannes</button><button class="btn" data-moi="tout">⛵ Tous les bateaux + objets</button><button class="btn" data-moi="epreuves">🌀 Finir les épreuves du Kraken</button></div>';
    }
  }
  openPanel(ME.role === 'createur' ? '👑 Menu du Créateur' : '🛡️ Menu Admin', h, true);
  const P = $('pcont'), on = (sel, f) => P.querySelectorAll(sel).forEach(b => b.onclick = () => f(b.dataset, b));
  on('[data-tab]', d => { adminOnglet = d.tab; confirmSuppr = null; panelAdmin(); });
  on('[data-met]', d => adm('meteo', { v: d.met })); on('[data-h]', d => adm('heure', { v: +d.h })); on('[data-mega]', d => adm('mega', { v: d.mega === '1', variante: d.var })); on('[data-krak]', d => adm('kraken', { v: d.krak === '1', variante: d.var })); on('[data-ecl]', d => adm('eclipse', { v: d.ecl === '1' }));
  on('[data-boost]', d => adm('boost', { mult: +d.boost, min: +d.min }));
  if ($('bAnn')) $('bAnn').onclick = async () => { if (await adm('annonce', { txt: $('annTxt').value })) $('annTxt').value = ''; };
  if ($('bAdmQ')) { $('bAdmQ').onclick = () => { adminQ = $('admQ').value; panelAdmin(); }; $('admQ').onkeydown = e => { if (e.key === 'Enter') $('bAdmQ').click(); }; }
  on('[data-ban]', async d => { if (await adm('ban', { nom: d.ban, min: +d.min })) panelAdmin(); });
  on('[data-deban]', async d => { if (await adm('deban', { nom: d.deban })) panelAdmin(); });
  on('[data-arg]', async d => { if (await adm('argent', { nom: d.arg, v: 10000 })) toast('💰 +10 000 $ pour ' + d.arg); });
  on('[data-lane]', async d => { if (await adm('canne', { nom: d.lane, v: 'lane' })) toast('🫏 Canne de Lane donnée à ' + d.lane); });
  on('[data-adm]', async d => { if (await adm('admin', { nom: d.adm, v: d.v === '1' })) panelAdmin(); });
  on('[data-sup]', async d => { if (confirmSuppr !== d.sup) { confirmSuppr = d.sup; return panelAdmin(); } confirmSuppr = null; if (await adm('supprimer', { nom: d.sup })) { toast('🗑️ Compte ' + d.sup + ' supprimé'); panelAdmin(); } });
  on('[data-join]', d => { wantSrv = +d.join; closePanel(); toast('🌐 Connexion au serveur ' + wantSrv + '…'); });
  if ($('bVol')) $('bVol').onclick = () => { volOn = !volOn; if (myBoat && myBoat.on) descendreBateau(); player.dive = false; panelAdmin(); };
  on('[data-tp]', d => { const [x, z] = d.tp.split(',').map(Number); if (myBoat && myBoat.on) descendreBateau(); player.x = x; player.z = z; player.y = Math.max(groundY(x, z), 0) + (volOn ? 6 : 0.5); player.vy = 0; closePanel(); toast('📍 Téléporté !'); });
  on('[data-moi]', async d => { if (await adm(d.moi, { v: isNaN(+d.v) ? d.v : +d.v })) toast('👑 Fait !'); });
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
const ACT_SLOT = { 2: () => panelSac(false), 3: panelCarnet, 4: panelMesCannes, 5: panelCarte, 6: panelTop };
async function poserCasier() {
  if (!(ME.objets.casier > 0)) return toast('🦀 Tu n\\'as pas de casier. Achète-en chez le 🧰 Quincaillier !');
  const x = player.x + Math.sin(player.ry) * 3.5, z = player.z + Math.cos(player.ry) * 3.5;
  if (H(x, z) > -0.6 || onDock(x, z)) return toast('🦀 Mets-toi au bord de l\\'eau, face à l\\'eau, pour poser ton casier');
  const r = await api('/api/casier/poser', { x, z }); if (r.err) return toast('❌ ' + r.err); setEtat(r.etat); son('plouf'); toast('🦀 Casier posé ! Reviens dans 3 minutes pour le relever.');
}
async function releverCasier(id) {
  const r = await api('/api/casier/relever', { id }); if (r.err) return toast('❌ ' + r.err); setEtat(r.etat); son('prise');
  if (!r.pris.length) return toast('🦀 Le casier était vide… (sac plein ?)');
  toast('🦀 Dans ton casier : ' + r.pris.map(f => variNom(f.vari) + mutNom(f.mut) + '<b style="color:' + DATA.RARETES[PMAP[f.id].r].coul + '">' + PMAP[f.id].nom + '</b> (' + f.kg + ' kg)').join(' + '), 5000);
}
function togglePlaneur() { if (!ME.objets.planeur) return toast('🪂 Achète un planeur chez le 🧰 Quincaillier'); planeurOn = !planeurOn; majHUD(); toast(planeurOn ? '🪂 Planeur prêt : saute d\\'un endroit haut et MAINTIENS ESPACE' : '🪂 Planeur rangé', 2500); }
function toggleRadar() { if (!ME.objets.radar) return toast('📡 Achète un radar chez le 🧰 Quincaillier'); radarOn = !radarOn; majHUD(); son('shake'); }
function plonger() {
  if (!ME.objets.plongee) return toast('🤿 Il te faut l\\'équipement de plongée (🧰 Quincaillier)');
  if (player.dive) { player.dive = false; return; }
  if (!player.swim) return toast('🤿 Va dans l\\'eau profonde pour plonger');
  player.dive = true; player.oxy = 1; annulerPeche(); errants = []; toast('🤿 Tu plonges ! ' + (ME.objets.harpon ? 'Clique pour harponner les poissons errants. ' : '') + 'G pour remonter.', 3500);
}
$('slotAmis').onclick = () => { if (panelOpen) closePanel(); else panelAmis(); }; $('slotAdmin').onclick = () => { if (panelOpen) closePanel(); else panelAdmin(); };
$('slot7').onclick = poserCasier; $('slot8').onclick = togglePlaneur; $('slot9').onclick = toggleRadar; $('bPlonge').onclick = plonger;
document.querySelectorAll('#hotbar [data-k]').forEach(el => el.onclick = () => { if (panelOpen) closePanel(); else ACT_SLOT[el.dataset.k](); });

// ---------- PNJ ----------
const NPCS = [
  { id: 'marchand', nom: '💰 Marchand', x: 18, z: 8.6, ry: Math.PI, ix: 18, iz: 5, shirt: hex('#2b9be0'), hat: hex('#ffffff'), act: () => panelSac(true) },
  { id: 'appats', nom: '🪱 Appâts', x: 25.5, z: -2.6, ry: 0, ix: 25.5, iz: -1.8, shirt: hex('#3fbf55'), hat: hex('#7a5230'), act: panelAppats },
  { id: 'totems', nom: '🗿 Totems', x: 7, z: -14.2, ry: 0, ix: 7, iz: -13.2, shirt: hex('#8a5cd8'), hat: hex('#3a2a6a'), act: panelTotems },
  { id: 'chantier', nom: '⚓ Chantier Naval', x: 24.5, z: 4.6, ry: Math.PI, ix: 24.5, iz: 2.6, shirt: hex('#1f3f6a'), hat: hex('#f2f2ee'), act: () => panelBateaux([36, -7, Math.PI / 2]) },
  { id: 'quetes', nom: '📜 Vieux Marin [Quêtes]', x: 9, z: 3.4, ry: Math.PI, ix: 9, iz: 1.9, shirt: hex('#8a6a4a'), hat: hex('#3a3a3a'), act: () => panelQuete() },
  { id: 'bazar', nom: '🧰 Quincaillier', x: 9, z: -3.6, ry: 0, ix: 9, iz: -2.1, shirt: hex('#c87a2a'), hat: hex('#5a5a5a'), act: () => panelBazar() }
];
const ROLES_ILES = {
  braise: [['marchand', '💰 Marchand'], ['enchant', '🔮 Autel d\\'Enchantement']],
  givre: [['marchand', '💰 Marchand'], ['evaluer', '🔍 Évaluateur']],
  marais: [['marchand', '💰 Marchand'], ['appats', '🪱 Appâts']],
  recif: [['marchand', '💰 Marchand'], ['chantier', '⚓ Chantier Naval']],
  prehisto: [['marchand', '💰 Marchand'], ['chantier', '⚓ Chantier Naval']],
  abysses: [['marchand', '💰 Marchand'], ['gardien', '🗿 Le Gardien des Abysses']]
};
const TENUES = { gardien: ['#2a3a3a', '#4ad0c0'], marchand: ['#2b9be0', '#ffffff'], cannes: ['#d8423a', '#e9c46a'], enchant: ['#6a2ab0', '#2a1a5a'], evaluer: ['#e0e0e0', '#3a3a3a'], appats: ['#3fbf55', '#7a5230'], chantier: ['#1f3f6a', '#f2f2ee'] };
for (const I of ILES) {
  if (I.nodock) continue;
  ROLES_ILES[I.id].forEach(([role, nom], k) => {
    const v = (k - 0.5) * 8, u = I.R - 9;
    const x = I.x + I.dx * u + I.px * v, z = I.z + I.dz * u + I.pz * v;
    const spawn = [I.x + I.dx * (I.R + 8) + I.px * 9, I.z + I.dz * (I.R + 8) + I.pz * 9, I.ry];
    const act = role === 'marchand' ? () => panelSac(true) : role === 'cannes' ? () => panelCannes(I.id) : role === 'enchant' ? panelEnchant : role === 'evaluer' ? panelEvaluer : role === 'appats' ? panelAppats : role === 'gardien' ? panelGardien : () => panelBateaux(spawn);
    NPCS.push({ id: I.id + '_' + role, nom, x, z, ry: I.ry, ix: x + I.dx * 1.6, iz: z + I.dz * 1.6, shirt: hex(TENUES[role][0]), hat: hex(TENUES[role][1]), act, ile: I });
  });
}
// ---------- présentoirs des cannes (posées par terre avec leur nom) ----------
const STANDS = [];
{
  const dep = ['bambou', 'pecheur', 'carbone', 'corail', 'tempete'];
  dep.forEach((id, k) => STANDS.push({ id, x: 13 + k * 2.5, z: -3.7, ry: 0 }));
  const parIle = { braise: ['magma'], givre: ['givre'], marais: ['marecage'], recif: ['abyssale', 'etoile'], prehisto: ['megalo'] };
  for (const I of ILES) {
    const l = parIle[I.id]; if (!l) continue;
    l.forEach((id, k) => { const v = (k - (l.length - 1) / 2) * 2.8, u = I.R - 15; STANDS.push({ id, x: I.x + I.dx * u + I.px * v, z: I.z + I.dz * u + I.pz * v, ry: I.ry }); });
  }
  const E = ILES.find(i => i.id === 'epave'); STANDS.push({ id: 'naufrage', x: E.x - 1.5, z: E.z + 1.8, ry: 0.7, cache: true });
  for (const st of STANDS) COLLIDERS.push({ x: st.x, z: st.z, r: 0.45 });
}
const FLAMMES_POS = {}; // rempli à la construction du monde
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
  if (CMAP[ME.canne].instant) { F.st = 'combat'; F.reel = null; finCombat(true); return; }
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
  if (r.err && !r.parti) return toast('❌ ' + r.err);
  setEtat(r.etat);
  if (r.monde) setMonde(r.monde);
  if (r.parti) { son('rate'); toast(r.err); return; }
  if (!ok) { son('rate'); toast('💨 Le poisson s\\'est échappé…'); return; }
  const f = r.poisson, p = PMAP[f.id], R = DATA.RARETES[p.r];
  if (CIN_TYPE[f.id] && !CIN) { lancerCinematique(f.id, () => afficherPrise(r)); return; }
  afficherPrise(r);
}
const CIN_TYPE = { megalodon: 'normal', megaancien: 'ancien', megafantome: 'fantome', grandkraken: 'kraken', krakenancien: 'krakenA' };
const CIN_TITRE = { normal: '🦈 MÉGALODON !!!', ancien: '🦈 MÉGALODON ANCIEN !!!', fantome: '👻 MÉGALODON FANTÔME !!!', kraken: '🐙 LE KRAKEN !!!', krakenA: '🐙🔥 KRAKEN ANCIEN !!!' };
let gouttes = [];
function lancerCinematique(id, fin) {
  const ty = CIN_TYPE[id], ry = player.ry;
  CIN = { ty, t: 0, dur: ty.startsWith('kraken') ? 5.6 : 5.4, x: player.x, y: player.y, z: player.z, fx: Math.sin(ry), fz: Math.cos(ry), sx: Math.cos(ry), sz: -Math.sin(ry), fin, splash1: false, splash2: false, eclairs: 0 };
  annulerPeche(); $('cinBandes').classList.remove('hide');
  $('cinFx').className = ty === 'ancien' ? 'aurore' : ty === 'fantome' ? 'fantome' : 'hide';
  son('touche');
}
function finCinematique() { const f = CIN.fin; CIN = null; gouttes = []; $('cinBandes').classList.add('hide'); $('cinFx').className = 'hide'; $('cinTitre').classList.add('hide'); f(); }
function eclabousser(x, z, n, force) { for (let k = 0; k < n; k++) { const a = Math.random() * 6.28, v = Math.random() * force; gouttes.push({ x, y: 0.2, z, vx: Math.cos(a) * v * 0.5, vy: 4 + Math.random() * force, vz: Math.sin(a) * v * 0.5, s: 0.5 + Math.random() }); } son('plouf'); }
function afficherPrise(r) {
  const f = r.poisson, p = PMAP[f.id], R = DATA.RARETES[p.r];
  son('prise');
  const e = $('prise'); e.style.borderColor = R.coul;
  e.innerHTML = '<div class="r" style="color:' + R.coul + '">' + R.nom + '</div><div class="n">' + variNom(f.vari) + mutNom(f.mut) + p.nom + '</div><div class="d">' + f.kg + ' kg • <b style="color:#7dff8a">' + fmt(f.valeur) + '</b></div>' + (r.nouveau ? '<div class="new">📖 NOUVEAU dans ton carnet !</div>' : '');
  e.classList.remove('hide'); clearTimeout(e._t); e._t = setTimeout(() => e.classList.add('hide'), 3200);
  F.catchShow = { id: f.id, t: 0, big: p.taille * (f.mut === 'geant' ? 1.5 : 1) };
  if (r.bonus) setTimeout(() => { toast(r.bonus, 7000); son('magie'); }, 1200);
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
      if (CMAP[ME.canne].instant) { F.wait = 0; F.nextShake = 99; }
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
  if (e.button === 0) { mouseL = true; holdInput = true; if (player.dive) { tirerHarpon(); return; } if (F.st === 'idle') commencerCharge(); }
});
window.addEventListener('mousemove', e => { if (drag) { cam.yaw -= (e.clientX - drag.x) * 0.006; cam.pitch = clamp(cam.pitch + (e.clientY - drag.y) * 0.005, 0.05, 1.3); drag = { x: e.clientX, y: e.clientY }; } });
window.addEventListener('mouseup', e => { if (e.button === 0) { mouseL = false; holdInput = keys.Space || false; if (F.st === 'charge') lancer(); } else drag = null; });
cv.addEventListener('wheel', e => { cam.dist = clamp(cam.dist + e.deltaY * 0.01, 4, 22); e.preventDefault(); }, { passive: false });
window.addEventListener('keydown', e => {
  if (e.target.tagName === 'INPUT') return;
  keys[e.code] = true;
  if (e.code === 'Space') { e.preventDefault(); if (document.activeElement && document.activeElement.tagName === 'BUTTON') document.activeElement.blur(); if (F.st === 'combat' || F.st === 'touche') holdInput = true; else if (!e.repeat) sauter(); }
  if (e.code === 'KeyE' && !e.repeat) { if (panelOpen) closePanel(); else if (npcProche) npcProche.act(); }
  if (e.code === 'Digit1' && !e.repeat && !panelOpen) toggleCanne();
  if (e.code === 'KeyC' && !e.repeat) { if (curPanel === 'mescannes') closePanel(); else if (!panelOpen) panelMesCannes(); }
  if (!e.repeat && (e.code === 'Digit0' || e.code === 'KeyK')) { if (panelOpen) closePanel(); else if (e.code === 'Digit0') panelAmis(); else panelAdmin(); }
  if (!e.repeat && !panelOpen) { if (e.code === 'Digit7') poserCasier(); if (e.code === 'Digit8') togglePlaneur(); if (e.code === 'Digit9') toggleRadar(); if (e.code === 'KeyG') plonger(); }
  const dk = { Digit2: 'sac', Digit3: 'carnet', Digit4: 'mescannes', Digit5: 'carte', Digit6: 'top' }[e.code];
  if (dk && !e.repeat) { if (panelOpen) closePanel(); else ACT_SLOT[e.code.slice(5)](); }
  if (e.code === 'KeyM' && !e.repeat) { if (curPanel === 'carte') closePanel(); else if (!panelOpen) panelCarte(); }
  if (e.code === 'Escape') closePanel();
  if (e.code === 'KeyR') annulerPeche();
  if (e.code === 'KeyI' && !panelOpen) panelSac(false); else if (e.code === 'KeyI' && curPanel === 'sac') closePanel();
  if (e.code === 'KeyB' && !panelOpen) panelCarnet(); else if (e.code === 'KeyB' && curPanel === 'carnet') closePanel();
});
window.addEventListener('keyup', e => { keys[e.code] = false; if (e.code === 'Space') { holdInput = mouseL; if (e.target && e.target.tagName === 'BUTTON') e.preventDefault(); } });
document.addEventListener('click', () => { const a = document.activeElement; if (a && a.tagName === 'BUTTON') a.blur(); }, true);
setTimeout(() => { const s = document.getElementById('slotSaut'); if (s) s.onclick = () => sauter(); }, 0);
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
$('bCast').addEventListener('touchstart', e => { e.preventDefault(); holdInput = true; if (player.dive) { tirerHarpon(); return; } if (F.st === 'idle') commencerCharge(); }, { passive: false });
$('bCast').addEventListener('touchend', e => { e.preventDefault(); holdInput = false; if (F.st === 'charge') lancer(); }, { passive: false });
$('bE').addEventListener('touchstart', e => { e.preventDefault(); if (npcProche && !panelOpen) npcProche.act(); else if (F.st !== 'idle') annulerPeche(); }, { passive: false });
$('bSaut').addEventListener('touchstart', e => { e.preventDefault(); holdGlide = true; sauter(); }, { passive: false });
$('bSaut').addEventListener('touchend', e => { e.preventDefault(); holdGlide = false; }, { passive: false });
$('prompt').onclick = () => { if (npcProche) npcProche.act(); };

// =====================================================================
//  JOUEUR
// =====================================================================
async function tirerHarpon() {
  if (!ME.objets.harpon) return toast('🔱 Il te faut un harpon (🧰 Quincaillier)');
  if (performance.now() - harponT < 1200) return; harponT = performance.now(); son('shake');
  const fx = -Math.sin(cam.yaw), fz = -Math.cos(cam.yaw); let best = null, bd = 99;
  for (const e of errants) { const dx = e.x - player.x, dz = e.z - player.z, d = Math.hypot(dx, dz); if (d < 15 && (dx * fx + dz * fz) / d > 0.82 && d < bd) { bd = d; best = e; } }
  F.harpon = { t: 0, to: best ? [best.x, best.y, best.z] : [player.x + fx * 12, player.y + 1, player.z + fz * 12] };
  if (!best) return;
  errants.splice(errants.indexOf(best), 1);
  const r = await api('/api/harpon', { zone: zoneAt(player.x, player.z) }); if (r.err) return toast('❌ ' + r.err);
  setEtat(r.etat); son('prise'); const f = r.poisson, p = PMAP[f.id];
  toast('🔱 Harponné : ' + variNom(f.vari) + mutNom(f.mut) + '<b style="color:' + DATA.RARETES[p.r].coul + '">' + p.nom + '</b> • ' + f.kg + ' kg • ' + fmt(f.valeur) + (r.nouveau ? ' 📖 NOUVEAU !' : ''), 4000);
}
function sauter() {
  if (panelOpen || volOn || player.air || player.swim || (myBoat && myBoat.on)) return;
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
  if (H(fx, fz) > -0.7 || H(nx, nz) > -0.7 || onDock(fx, fz) || (!gouffreOuvert() && (porteGouffre(fx, fz) || porteGouffre(nx, nz)))) { if (Math.abs(myBoat.v) > 4) { bumpT -= dt; if (bumpT <= 0) { toast('💥 Attention, ça touche le fond !'); son('rate'); bumpT = 2; } } myBoat.v = -myBoat.v * 0.25; }
  else { myBoat.x = nx; myBoat.z = nz; }
  if (Math.abs(myBoat.x) > 410) myBoat.x = Math.sign(myBoat.x) * 410; if (Math.abs(myBoat.z) > 410) myBoat.z = Math.sign(myBoat.z) * 410;
  player.x = myBoat.x - sx * bi.len * 0.12; player.z = myBoat.z - sz * bi.len * 0.12; player.ry = myBoat.ry;
  player.y = waveY(myBoat.x, myBoat.z, performance.now() / 1000) + bi.deck; player.moving = false; player.swim = false; player.air = false;
  if (Math.abs(myBoat.v) > 1.5 && !drag) { let d = (myBoat.ry + Math.PI) - cam.yaw; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; cam.yaw += d * Math.min(1, dt * 1.8); }
}
function majJoueur(dt) {
  if (CIN) { player.moving = false; return; }
  let ix = 0, iz = 0;
  if (!panelOpen) {
    if (keys.KeyW || keys.ArrowUp) iz -= 1; if (keys.KeyS || keys.ArrowDown) iz += 1;
    if (keys.KeyA || keys.ArrowLeft) ix -= 1; if (keys.KeyD || keys.ArrowRight) ix += 1;
    ix += joy.dx; iz += joy.dz;
  }
  if (volOn && ME.role && !(myBoat && myBoat.on)) {
    const sy = Math.sin(cam.yaw), cy = Math.cos(cam.yaw), fx = -sy, fz = -cy, rx = cy, rz = -sy;
    const dx = rx * ix - fx * iz, dz = rz * ix - fz * iz, sp = keys.ShiftRight ? 60 : 28;
    player.x = clamp(player.x + dx * sp * dt, -415, 415); player.z = clamp(player.z + dz * sp * dt, -415, 415);
    if (keys.Space) player.y += 14 * dt; if (keys.ShiftLeft) player.y -= 14 * dt; player.y = Math.max(player.y, groundY(player.x, player.z));
    player.moving = Math.hypot(dx, dz) > 0.1; if (player.moving) player.ry = Math.atan2(dx, dz); player.air = true; player.swim = false; player.vy = 0;
  }
  else if (myBoat && myBoat.on) majBateau(dt, ix, iz);
  else {
    const l = Math.hypot(ix, iz);
    player.moving = l > 0.15;
    if (player.moving) {
      if (F.st !== 'idle' && F.st !== 'fin') annulerPeche();
      if (l > 1) { ix /= l; iz /= l; }
      const sy = Math.sin(cam.yaw), cy = Math.cos(cam.yaw);
      const fx = -sy, fz = -cy, rx = cy, rz = -sy;
      const dx = (rx * ix - fx * iz), dz = (rz * ix - fz * iz);
      const sp = player.dive ? 4.6 : player.swim ? 3.8 : keys.ShiftLeft ? 9.5 : 6.2;
      const nx = player.x + dx * sp * dt, nz = player.z + dz * sp * dt;
      const g0 = Math.max(groundY(player.x, player.z), -0.9);
      const ok = (x, z) => {
        const g = groundY(x, z);
        if (g > -0.9 && g - Math.max(g0, player.y) > 1.15) return false;
        if (g > -0.6) for (const c of COLLIDERS) if (Math.abs(x - c.x) < 6 && Math.abs(z - c.z) < 6 && Math.hypot(x - c.x, z - c.z) < c.r + 0.35) return false;
        if (myBoat && !myBoat.on && Math.hypot(x - myBoat.x, z - myBoat.z) < 1.4) return false;
        if (!gouffreOuvert() && porteGouffre(x, z)) return false;
        return Math.abs(x) < 415 && Math.abs(z) < 415;
      };
      if (ok(nx, nz)) { player.x = nx; player.z = nz; } else if (ok(nx, player.z)) player.x = nx; else if (ok(player.x, nz)) player.z = nz;
      const tr = Math.atan2(dx, dz); let d = tr - player.ry; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; player.ry += d * Math.min(1, dt * 12);
      player.walk += dt * sp * 1.6;
    } else player.walk = lerp(player.walk, Math.round(player.walk / Math.PI) * Math.PI, dt * 8);
    // hauteur : saut, gravité, nage, plongée, planeur
    const g = groundY(player.x, player.z);
    const nage = g < -0.95 && !onDock(player.x, player.z);
    if (player.dive && !nage) player.dive = false;
    if (player.dive) {
      player.swim = true; player.air = false; player.vy = 0;
      const fond = Math.max(g + 1.3, -16);
      const cible = keys.Space ? Math.min(player.y + 4, -1.4) : keys.ShiftLeft ? fond : Math.max(fond, Math.min(player.y, -5));
      player.y = lerp(player.y, Math.min(cible, -1.4), Math.min(1, dt * 2.5));
      player.oxy -= dt / 45;
      if (player.oxy <= 0) { player.dive = false; toast('😮‍💨 Plus d\\'oxygène ! Tu remontes à la surface.'); }
    } else if (nage && player.y < 0.4) {
      if (!player.swim && F.st !== 'idle') annulerPeche();
      player.swim = true; player.air = false; player.vy = 0;
      player.y = lerp(player.y, waveY(player.x, player.z, performance.now() / 1000) - 1.25, Math.min(1, dt * 6));
    } else {
      player.swim = false;
      player.glide = planeurOn && player.air && player.vy < 0 && (keys.Space || holdGlide);
      if (player.glide) { player.vy = Math.max(player.vy - 6 * dt, -2.2); player.x += Math.sin(player.ry) * 13 * dt; player.z += Math.cos(player.ry) * 13 * dt; player.y += player.vy * dt; if (player.y <= g) { player.y = g; player.vy = 0; player.air = false; } }
      else { player.vy -= 24 * dt; player.y += player.vy * dt; }
      if (player.y <= g) { player.y = g; player.vy = 0; player.air = false; }
      else if (player.y - g > 0.35) player.air = true;
      if (player.glide) player.air = true;
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
    for (const st of STANDS) { if (st.cache && ME.cannes.includes(st.id)) continue; const d = Math.hypot(player.x - st.x, player.z - st.z); if (d < 2.2 && d < best + 1) { best = d; npcProche = st.cache ? { nom: '✨ Ramasser ???', act: ramasser } : { nom: '🎣 ' + CMAP[st.id].nom, act: () => panelCanneStand(st.id) }; } }
    for (const c of ME.casiers) { const d = Math.hypot(player.x - c.x, player.z - c.z); if (d < 5.5 && d < best + 2) { best = d; npcProche = Date.now() >= c.fin ? { nom: '🦀 Relever le casier', act: () => releverCasier(c.id) } : { nom: '🦀 Casier pas prêt (' + Math.ceil(Math.max(0, c.fin - Date.now()) / 1000) + ' s)', act: () => toast('🦀 Patience…') }; } }
    for (const id in FLAMMES_POS) { const f = FLAMMES_POS[id]; if (!ME.quetes.flammes.includes(id) && Math.hypot(player.x - f[0], player.z - f[2]) < 2.6) npcProche = { nom: '🔥 Allumer la Flamme Ancienne', act: () => allumer(id) }; }
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
  if (c.role === 'createur') { draw(CH.ane, MBb); draw(CH.couronne, M4.mul(MBb, M4.T(0, 0.08, 0)), { unlit: 1 }); }
  else { draw(CH.head, MBb); draw(CH.hat, MBb, { tint: c.hat }); }
  const swimA = c.swim ? -2.6 + Math.sin(c.walk * 0.8) * 0.9 : 0;
  draw(CH.arm, M4.chain(MBb, M4.T(-0.47, 1.65, 0), M4.Rx(c.swim ? swimA : c.air ? -2.4 : -sw * 0.8)), { tint: c.shirt });
  if (c.swim) { draw(CH.arm, M4.chain(MBb, M4.T(0.47, 1.65, 0), M4.Rx(-2.6 - Math.sin(c.walk * 0.8) * 0.9)), { tint: c.shirt }); return null; }
  const aa = c.rod ? c.armA : c.air ? -2.4 : sw * 0.8;
  const MA = M4.chain(MBb, M4.T(0.47, 1.65, 0), M4.Rx(aa));
  draw(CH.arm, MA, { tint: c.shirt });
  if (c.rod) {
    const MR = M4.chain(MA, M4.T(0, -0.68, 0.05), M4.Rx(c.rodT - aa));
    draw(rodMesh(c.rodId || 'bambou'), MR);
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
  if (ECLIPSE) { ciel = [0.16, 0.08, 0.14]; sunCol = [0.5, 0.25, 0.3]; amb = [0.22, 0.16, 0.26]; fogN = 40; fogF = 180; }
  // transitions douces
  const E = envCache; const k = 0.03;
  E.ciel = E.ciel ? mixc(E.ciel, ciel, k) : ciel; E.sunCol = E.sunCol ? mixc(E.sunCol, sunCol, k) : sunCol; E.amb = E.amb ? mixc(E.amb, amb, k) : amb;
  E.fogN = E.fogN ? lerp(E.fogN, fogN, k) : fogN; E.fogF = E.fogF ? lerp(E.fogF, fogF, k) : fogF;
  E.sunDir = sunDir; E.light = lightDir; E.jour = jour;
  let zen = mixc(hex('#050a1c'), hex('#2a72cc'), jour); zen = mixc(zen, hex('#4a5a9a'), couchant * 0.4);
  if (meteo !== 'soleil') zen = mixc(zen, E.ciel.map(v => v * 0.85), meteo === 'nuageux' ? 0.5 : 0.85);
  E.zen = E.zen ? mixc(E.zen, zen, k) : zen;
  const hv = (meteo === 'brouillard' || meteo === 'pluie') ? 0.15 : meteo === 'nuageux' ? 0.5 : 1;
  E.halo = mixc([1, 0.9, 0.7], [1, 0.55, 0.3], couchant).map(v => v * clamp(sy * 4 + 0.6, 0, 1) * hv);
  if (ECLIPSE) { E.zen = mixc(E.zen, [0.04, 0.02, 0.06], 0.08); E.halo = [1.6, 0.35, 0.25]; }
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
  cy = Math.max(cy, groundY(cx, cz) + 0.6, player.dive ? -30 : 0.6);
  let ctx = tx, cty = ty, ctz = tz;
  if (CIN) {
    CIN.t += dt; const C = CIN, T = C.t, kr = C.ty.startsWith('kraken');
    if (T > 1.2 && $('cinTitre').classList.contains('hide')) { $('cinTitre').textContent = CIN_TITRE[C.ty]; $('cinTitre').classList.remove('hide'); son('magie'); }
    if (!kr) {
      const u = clamp((T - 1.3) / 2.3, 0, 1);
      C.px = C.x + C.fx * lerp(18, -15, u); C.pz = C.z + C.fz * lerp(18, -15, u); C.py = -7 + (C.y + 17) * 4 * u * (1 - u);
      if (u > 0.02 && !C.splash1) { C.splash1 = true; eclabousser(C.x + C.fx * 17, C.z + C.fz * 17, 50, 9); }
      if (u > 0.97 && !C.splash2) { C.splash2 = true; eclabousser(C.x - C.fx * 14, C.z - C.fz * 14, 70, 11); }
      const shake = T > 1.3 && T < 3.8 ? Math.sin(T * 47) * 0.12 : 0;
      if (T < 1.3) { cx = C.x + C.sx * 4.5 - C.fx * 2.5; cy = C.y + 2.4; cz = C.z + C.sz * 4.5 - C.fz * 2.5; ctx = C.x + C.fx * 12; cty = C.y; ctz = C.z + C.fz * 12; }
      else if (T < 3.8) { cx = C.x + C.sx * 7 - C.fx * 4; cy = C.y + 0.9 + shake; cz = C.z + C.sz * 7 - C.fz * 4; ctx = C.px; cty = C.py; ctz = C.pz; }
      else { const k = clamp((T - 3.8) / 1.2, 0, 1); cx = C.x + C.sx * lerp(7, 16, k) + C.fx * 2; cy = C.y + lerp(1, 7, k); cz = C.z + C.sz * lerp(7, 16, k) + C.fz * 2; ctx = C.x; cty = C.y + 1; ctz = C.z; }
    } else {
      const a = T * 0.45 + Math.atan2(C.sz, C.sx); cx = C.x + Math.cos(a) * 15; cz = C.z + Math.sin(a) * 15; cy = C.y + 4 + Math.sin(T) * 1.5; ctx = C.x; cty = C.y + 3.5; ctz = C.z;
      if (T > 1.0 && Math.random() < dt * 2.2) { $('cinFx').className = ''; void $('cinFx').offsetWidth; $('cinFx').className = 'flash'; son('shake'); C.eclairs = 0.3; }
      if (T < 1) { if (!C.splash1 && T > 0.4) { C.splash1 = true; for (let k = 0; k < 6; k++) { const a2 = k / 6 * 6.28; eclabousser(C.x + Math.cos(a2) * 8, C.z + Math.sin(a2) * 8, 15, 8); } } }
    }
    if (T >= C.dur) finCinematique();
  }
  const P = M4.persp(1.0, w / h, 0.1, 700); const V = M4.look([cx, cy, cz], [ctx, cty, ctz], [0, 1, 0]); VP = M4.mul(P, V);
  const hr = heureNow(); const E = environnement(hr, t);
  gl.clearColor(E.ciel[0], E.ciel[1], E.ciel[2], 1); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.uniformMatrix4fv(U.vp, false, VP); gl.uniform1f(U.t, t);
  gl.uniform3fv(U.sunDir, E.light); gl.uniform3fv(U.sunCol, E.sunCol); gl.uniform3fv(U.amb, E.amb); gl.uniform3fv(U.fogCol, E.ciel); gl.uniform3fv(U.cam, [cx, cy, cz]);
  if (player.dive) { gl.uniform1f(U.fogN, 2); gl.uniform1f(U.fogF, 32); gl.uniform3fv(U.fogCol, [0.05, 0.3, 0.45]); gl.clearColor(0.05, 0.3, 0.45, 1); } else { gl.uniform1f(U.fogN, E.fogN); gl.uniform1f(U.fogF, E.fogF); }
  gl.uniform3fv(U.zen, E.zen); gl.uniform3fv(U.halo, E.halo); gl.uniform3fv(U.sunPos, E.sunDir);
  // ciel
  gl.depthMask(false);
  draw(W.ciel, M4.chain(M4.T(cx, cy, cz), M4.S(450)), { sky: 1, nofog: 1 });
  if (E.jour < 0.6 && meteo !== 'pluie' && meteo !== 'brouillard') { const a = 1 - E.jour / 0.6; draw(W.etoiles, M4.chain(M4.T(cx, 0, cz), M4.Ry(t * 0.01)), { unlit: 1, nofog: 1, ps: 2 * dpr, tint: [a, a, a] }); }
  const sd = E.sunDir;
  if (sd[1] > -0.15 && meteo !== 'brouillard' && false) draw(W.soleil, M4.chain(M4.T(cx + sd[0] * 500, cy + sd[1] * 500, cz + sd[2] * 500), M4.S(28)), { unlit: 1, nofog: 1, tint: meteo === 'pluie' ? [0.6, 0.6, 0.6] : ONE });
  if (sd[1] < 0.15 && meteo !== 'brouillard') draw(W.lune, M4.chain(M4.T(cx - sd[0] * 500, cy - sd[1] * 500, cz - sd[2] * 500), M4.S(18)), { unlit: 1, nofog: 1 });
  gl.depthMask(true);
  // monde
  draw(W.fond, M4.T(player.x, 0, player.z));
  draw(W.terre, IDM, { det: 1 });
  const nuit = 1 - E.jour; draw(W.glow, IDM, { unlit: 1, tint: mixc([0.85, 0.85, 0.8], [1.25, 1.15, 0.8], nuit) });
  const cc = mixc([0.3, 0.3, 0.32], [1.05, 1.05, 1.08], E.jour); draw(W.nuages, M4.T((t * 0.6) % 60 - 30, 0, 0), { tint: meteo === 'pluie' ? cc.map(v => v * 0.6) : cc, unlit: 1 });
  // PNJ
  for (const n of NPCS) { if (Math.abs(n.x - player.x) > 110 || Math.abs(n.z - player.z) > 110) continue; const g = n.g === undefined ? (n.g = H(n.x, n.z)) : n.g; drawChar({ x: n.x, y: g, z: n.z, ry: n.ry, moving: false, walk: 0, shirt: n.shirt, hat: n.hat, ph: n.x }, t); placeLabel('npc_' + n.id, n.nom, n.x, g + 3.0, n.z, 'npc', 30); }
  // noms des îles au loin
  for (const I of ILES) { if (I.cache) continue; const d = Math.hypot(I.x - player.x, I.z - player.z); if (d > 55) placeLabel('ile_' + I.id, I.nom + ' • ' + Math.round(d) + ' m', I.x, 24, I.z, 'ile', 480); }
  if (Math.hypot(player.x, player.z) > 80) placeLabel('ile_depart', '🏝️ Île de Départ • ' + Math.round(Math.hypot(player.x, player.z)) + ' m', 0, 22, 0, 'ile', 480);
  const L = [], LC = [];
  // présentoirs de cannes
  let standProche = null;
  for (const st of STANDS) {
    if (Math.abs(st.x - player.x) > 70 || Math.abs(st.z - player.z) > 70) continue;
    const y = st.g === undefined ? (st.g = H(st.x, st.z)) : st.g; const c = CMAP[st.id]; const a = ME && ME.cannes.includes(st.id);
    if (st.cache) { if (a) continue; draw(rodMesh(st.id), M4.chain(M4.T(st.x, y + 0.12, st.z), M4.Ry(st.ry), M4.Rz(Math.PI / 2 - 0.08))); continue; }
    draw(rodMesh(st.id), M4.chain(M4.T(st.x, y + 0.86, st.z), M4.Ry(st.ry + t * 0.6), M4.Rz(0.12)));
    const dst = Math.hypot(st.x - player.x, st.z - player.z);
    if (dst < (standProche ? standProche.d : 99) && dst < 9) standProche = { st, d: dst };
  }
  if (standProche) { const st = standProche.st, c = CMAP[st.id], a = ME && ME.cannes.includes(st.id); placeLabel('st_lbl', c.nom + (a ? ' ✔' : ' • ' + fmt(c.prix)), st.x, st.g + 3.6, st.z, 'npc', 22); }
  // braseros
  for (const id in FLAMMES_POS) {
    const f = FLAMMES_POS[id]; if (Math.abs(f[0] - player.x) > 90 || Math.abs(f[2] - player.z) > 90) continue;
    if (ME && ME.quetes.flammes.includes(id)) { const fl = 1 + Math.sin(t * 9 + f[0]) * 0.12; draw(W.flamme, M4.chain(M4.T(f[0], f[1], f[2]), M4.Ry(t * 2), M4.S(fl, fl * (1.1 + Math.sin(t * 13) * 0.1), fl)), { unlit: 1 }); }
    else if (Math.hypot(f[0] - player.x, f[2] - player.z) < 14) placeLabel('fl_' + id, '🔥 Flamme Ancienne éteinte', f[0], f[1] + 1.5, f[2], 'npc', 14);
  }
  // Mégalodon : son aileron tourne
  if (MEGA) {
    const v = MEGA.variante || 'normal', a = t * 0.35, fx = MEGA.x + Math.cos(a) * 18, fz = MEGA.z + Math.sin(a) * 18, sc = v === 'ancien' ? 1.4 : 1.1;
    const mf = M4.chain(M4.T(fx, waveY(fx, fz, t) - 0.3, fz), M4.Ry(Math.atan2(-Math.sin(a), Math.cos(a))), M4.S(sc));
    if (v === 'fantome') { gl.enable(gl.BLEND); draw(W.aileron, mf, { unlit: 1, tint: [2.2, 2.6, 2.8], alpha: 0.45 + Math.sin(t * 3) * 0.15 }); gl.disable(gl.BLEND); }
    else draw(W.aileron, mf, { tint: v === 'ancien' ? [0.55, 0.7, 1.4] : ONE });
    placeLabel('mega', { normal: '🦈 MÉGALODON', ancien: '🦈 MÉGALODON ANCIEN', fantome: '👻 MÉGALODON FANTÔME' }[v], fx, 5, fz, 'ile', 260);
  }
  // Gouffre du Kraken
  if (Math.hypot(GOUFFRE.x - player.x, GOUFFRE.z - player.z) < 160) {
    if (!gouffreOuvert()) { draw(W.porte, IDM, { unlit: 1, tint: [0.8 + Math.sin(t * 3) * 0.2, 0.8, 1] }); placeLabel('porte', '🔒 Gouffre scellé', GOUFFRE.x + Math.cos(GOUFFRE.gap) * (GOUFFRE.r + 3.5), 12, GOUFFRE.z + Math.sin(GOUFFRE.gap) * (GOUFFRE.r + 3.5), 'npc', 120); }
    const kAnc = KRAKEN && KRAKEN.variante === 'ancien';
    for (let k = 0; k < 4; k++) { const a = k * 1.57 + t * 0.1, r = 9; const sink = KRAKEN ? 0 : -16; draw(W.tentacule, M4.chain(M4.T(GOUFFRE.x + Math.cos(a) * r, -6 + sink + Math.sin(t * 0.8 + k) * 1.2, GOUFFRE.z + Math.sin(a) * r), M4.Ry(-a), M4.Rz(Math.sin(t * 0.9 + k) * 0.25)), { tint: kAnc ? [0.6, 1.5, 0.6] : ONE }); }
    if (KRAKEN) placeLabel('kraken', kAnc ? '🐙🔥 KRAKEN ANCIEN' : '🐙 KRAKEN', GOUFFRE.x, 16, GOUFFRE.z, 'ile', 300);
  }
  // casiers
  if (ME) for (const c of ME.casiers) { if (Math.abs(c.x - player.x) > 120 || Math.abs(c.z - player.z) > 120) continue; draw(W.casier, M4.chain(M4.T(c.x, waveY(c.x, c.z, t) - 0.05, c.z), M4.Rz(Math.sin(t * 2 + c.x) * 0.1))); const rs = Math.ceil(Math.max(0, c.fin - Date.now()) / 1000); placeLabel('cas_' + c.id, rs > 0 ? '🦀 ' + Math.floor(rs / 60) + ':' + String(rs % 60).padStart(2, '0') : '🦀 Prêt !', c.x, 1.6, c.z, 'npc', 60); }
  // planeur
  if (ME && player.glide) draw(W.aile, M4.chain(M4.T(player.x, player.y + 2.75, player.z), M4.Ry(player.ry), M4.Rx(-0.45), M4.Rz(Math.sin(t * 2) * 0.05), M4.S(1, 2.2, 1)));
  // poissons errants sous l'eau (plongée)
  if (player.dive) {
    while (errants.length < 6) { const a = Math.random() * 6.28, d = 8 + Math.random() * 10, x = player.x + Math.cos(a) * d, z = player.z + Math.sin(a) * d, g = H(x, z); if (g > -3) { errants.push(null); errants.pop(); break; } const l = DATA.POISSONS.filter(p => p.zone === 'errant' || p.zone === zoneAt(x, z)); errants.push({ id: l[Math.floor(Math.random() * l.length)].id, x, z, y: lerp(g + 1, -1.5, Math.random()), a: Math.random() * 6.28, v: 1 + Math.random() * 1.5 }); }
    for (const e of errants) { e.a += (Math.random() - 0.5) * dt; e.x += Math.cos(e.a) * e.v * dt; e.z += Math.sin(e.a) * e.v * dt; if (H(e.x, e.z) > e.y - 0.5) e.a += Math.PI; draw(fishMesh(e.id), M4.chain(M4.T(e.x, e.y, e.z), M4.Ry(Math.atan2(Math.cos(e.a), Math.sin(e.a))), M4.S(Math.min(1.6, 0.6 + PMAP[e.id].taille * 0.35)))); }
    errants = errants.filter(e => Math.hypot(e.x - player.x, e.z - player.z) < 30);
  }
  if (F.harpon) { F.harpon.t += dt; const k = Math.min(1, F.harpon.t * 4); const a = [player.x, player.y + 1.4, player.z], b2 = F.harpon.to; L.push(...a, lerp(a[0], b2[0], k), lerp(a[1], b2[1], k), lerp(a[2], b2[2], k)); LC.push(0.9, 0.9, 0.95, 0.9, 0.9, 0.95); if (F.harpon.t > 0.6) F.harpon = null; }
  // radar : zones de pêche autour
  if (radarOn && ME) {
    const jourR = estJour(hr), points = [['etang', POND[0], POND[1]], ['cote', 0, 40], ['large', 75, 0]].concat(ILES.filter(I => !I.cache).map(I => [I.id, I.x - I.dx * (I.R + 12), I.z - I.dz * (I.R + 12)])).concat([['gouffre', GOUFFRE.x, GOUFFRE.z]]);
    if (MEGA) points.push(['mega', MEGA.x, MEGA.z]);
    for (const [z, x, zz] of points) {
      const d = Math.hypot(x - player.x, zz - player.z); if (d > 170) continue;
      const dispo = DATA.POISSONS.filter(p => p.zone === z && (p.moment === 'tous' || (p.moment === 'jour') === jourR) && (!p.meteo || p.meteo === meteo));
      const best = dispo.reduce((m, p) => Math.max(m, p.r), 0);
      placeLabel('rad_' + z, '📡 ' + NOM_ZONE[z] + ' • ' + dispo.length + ' dispo • max ' + DATA.RARETES[best].nom, x, 3.5, zz, 'npc', 170);
    }
  }
  // ombres sous les personnages
  gl.enable(gl.BLEND); gl.depthMask(false);
  const ombre = (x, y, z, r) => draw(W.ombre, M4.chain(M4.T(x, y + 0.04, z), M4.S(r, 1, r)), { unlit: 1, alpha: 0.32 });
  if (ME && !player.swim && !(myBoat && myBoat.on)) ombre(player.x, groundY(player.x, player.z), player.z, player.air ? 0.4 : 0.55);
  for (const n of NPCS) if (Math.abs(n.x - player.x) < 60 && Math.abs(n.z - player.z) < 60) ombre(n.x, n.g === undefined ? H(n.x, n.z) : n.g, n.z, 0.55);
  for (const nom in autres) { const o = autres[nom]; if (o.a !== 's' && !(o.bt && o.bt.on)) ombre(o.x, groundY(o.x, o.z), o.z, 0.55); }
  gl.depthMask(true); gl.disable(gl.BLEND);
  // bateaux
  const drawBoat = (bt) => { const bi = BOAT_INFO[bt.t]; if (!bi || !BOATS[bt.t]) return; draw(BOATS[bt.t], M4.chain(M4.T(bt.x, waveY(bt.x, bt.z, t) - 0.1, bt.z), M4.Ry(bt.ry), M4.Rz(Math.sin(t * 1.3 + bt.x) * 0.035), M4.Rx(Math.sin(t * 1.1) * 0.025 - (bt.v || 0) * 0.004))); };
  if (myBoat) drawBoat(myBoat);
  // autres joueurs
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
    const tip = drawChar({ x: o.x, y: o.y, z: o.z, ry: o.ry, moving: o.moving, walk: o.walk, shirt: o.shirt, hat: o.hat, rod: o.rod !== false && !swim, seated: !!(o.bt && o.bt.on), swim, armA: o.armA, rodT: o.rodT, rodId: o.canne, role: o.role }, t);
    if (peche && o.b) { const b = [o.b[0], waveY(o.b[0], o.b[2], t), o.b[2]]; draw(CH.bob, M4.T(b[0], b[1], b[2])); ligne(tip, b); }
    placeLabel('p_' + nom, (o.role === 'createur' ? '👑 ' : o.role === 'admin' ? '🛡️ ' : '') + nom, o.x, o.y + (o.role === 'createur' ? 3.25 : 2.9), o.z, 'pseudo' + (o.role ? ' ' + o.role : ''), 60);
  }
  // moi
  if (ME) {
    const tip = drawChar({ x: player.x, y: player.y, z: player.z, ry: player.ry, moving: player.moving || player.swim, walk: player.walk + (player.swim ? t * 4 : 0), shirt: MY.shirt, hat: MY.hat, rod: player.rodOut && !player.swim, seated: !!(myBoat && myBoat.on), swim: player.swim, air: player.air, armA: player.armA, rodT: player.rodT, rodId: ME.canne, role: ME.role }, t);
    F.tip = tip;
    placeLabel('moi', (ME.role === 'createur' ? '👑 ' : ME.role === 'admin' ? '🛡️ ' : '') + ME.nom, player.x, player.y + (ME.role === 'createur' ? 3.25 : 2.9), player.z, 'pseudo moi' + (ME.role ? ' ' + ME.role : ''), 60);
    if (F.st === 'vol' || F.st === 'attente' || F.st === 'touche' || F.st === 'combat') {
      draw(CH.bob, M4.T(F.bob[0], F.bob[1], F.bob[2]));
      if (F.st === 'vol') { L.push(...tip, ...F.bob); LC.push(...lc, ...lc); } else ligne(tip, F.bob);
    }
    if (F.catchShow) {
      const cs = F.catchShow, s = Math.min(1, cs.t * 4) * Math.min(1.3, 0.5 + cs.big * 0.35);
      draw(fishMesh(cs.id), M4.chain(M4.T(player.x, player.y + 3.0 + Math.sin(cs.t * 3) * 0.1, player.z), M4.Ry(cs.t * 1.5), M4.Rz(Math.sin(cs.t * 8) * 0.15), M4.S(s)));
    }
  }
  if (CIN) {
    const C = CIN;
    if (!C.ty.startsWith('kraken')) {
      const mesh = C.ty === 'ancien' ? W.requinA : C.ty === 'fantome' ? W.requinF : W.requinN, sc = C.ty === 'ancien' ? 1.35 : 1.1;
      let px = C.px, py = C.py, pz = C.pz, yaw = Math.atan2(-C.fx, -C.fz), pitch = 0;
      if (C.t < 1.3) { // avant le saut : il nage sous l'eau vers le joueur
        const k = C.t / 1.3; px = C.x + C.fx * lerp(30, 18, k) + C.sx * Math.sin(C.t * 3) * 2; pz = C.z + C.fz * lerp(30, 18, k) + C.sz * Math.sin(C.t * 3) * 2; py = -4.5;
      } else { const u = clamp((C.t - 1.3) / 2.3, 0, 1), vy = (C.y + 17) * 4 * (1 - 2 * u), vh = 33; pitch = Math.atan2(vy / 2.3, vh / 2.3); }
      const M = M4.chain(M4.T(px, py, pz), M4.Ry(yaw), M4.Rx(-pitch), M4.S(sc));
      if (C.ty === 'fantome') { gl.enable(gl.BLEND); gl.depthMask(false); draw(mesh, M, { unlit: 1, tint: [1.15, 1.2, 1.25], alpha: 0.55 + Math.sin(C.t * 6) * 0.1 }); gl.depthMask(true); gl.disable(gl.BLEND); }
      else draw(mesh, M);
    } else { // tentacules géantes autour du joueur
      const anc = C.ty === 'krakenA';
      for (let k = 0; k < 7; k++) {
        const a = k / 7 * 6.283 + C.t * 0.15, r = 8 + (k % 2) * 2, monte = clamp(C.t / 1.6, 0, 1), y = lerp(-20, -3.5 + (k % 3) * 1.2, monte * monte * (3 - 2 * monte));
        const tx2 = C.x + Math.cos(a) * r, tz2 = C.z + Math.sin(a) * r;
        draw(W.tentacule, M4.chain(M4.T(tx2, y, tz2), M4.Ry(-a + Math.PI), M4.Rz(Math.sin(C.t * 1.7 + k) * 0.35 - 0.25), M4.S(1.3, 1.25, 1.3)), { tint: anc ? [1.5, 0.95, 0.35] : [0.45, 1.25, 0.65] });
        if (C.eclairs > 0 && k % 2 === 0) { let lx = tx2, ly = 30, lz = tz2; for (let s = 0; s < 6; s++) { const nx = tx2 + (Math.random() - 0.5) * 4, ny = 30 - (s + 1) * 4.5, nz = tz2 + (Math.random() - 0.5) * 4; L.push(lx, ly, lz, nx, ny, nz); LC.push(0.6, 0.9, 1, 0.6, 0.9, 1); lx = nx; ly = ny; lz = nz; } }
      }
      C.eclairs = Math.max(0, C.eclairs - dt);
    }
  }
  if (gouttes.length) { for (const g of gouttes) { g.vy -= 18 * dt; g.x += g.vx * dt; g.y += g.vy * dt; g.z += g.vz * dt; draw(W.goutte, M4.chain(M4.T(g.x, g.y, g.z), M4.S(g.s)), { unlit: 1, tint: [0.92, 0.97, 1] }); } gouttes = gouttes.filter(g => g.y > -1); }
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
  if (ME) {
    $('oxy').classList.toggle('hide', !player.dive); if (player.dive) $('oxy').querySelector('.b div').style.width = Math.max(0, player.oxy * 100) + '%';
    $('sousleau').classList.toggle('hide', !(cy < waveY(cx, cz, t) - 0.1 || player.dive));
    $('bPlonge').style.display = ME.objets.plongee && (player.swim || player.dive) ? 'block' : 'none'; $('bPlonge').textContent = player.dive ? '⬆️ Remonter (G)' : '🤿 Plonger (G)';
  }
  { // boussole
    const head = Math.atan2(-Math.sin(cam.yaw), Math.cos(cam.yaw)) * 180 / Math.PI; // 0 = nord (-z)
    if (!window._bs) { window._bs = []; const D = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO']; for (let k = -8; k < 16; k++) { const sp = document.createElement('span'); sp.textContent = D[(k + 16) % 8]; $('bstrip').appendChild(sp); window._bs.push([sp, k * 45]); } }
    for (const [sp, a] of window._bs) { let d = a - head; while (d < -270) d += 360; while (d > 270) d -= 360; sp.style.left = (150 + d * 2.2) + 'px'; sp.style.display = Math.abs(d) < 90 ? '' : 'none'; }
  }
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
let syncEnCours = false, wantSrv = 0, monSrv = 0, nbDemandes = 0, volOn = false;
function setMonde(m) { if (!m) return; if ('mega' in m) MEGA = m.mega; if ('kraken' in m) KRAKEN = m.kraken; if ('eclipse' in m) ECLIPSE = !!m.eclipse; worldH = m.h; worldT0 = performance.now(); jourMs = m.jourMs || jourMs; if (m.meteo) meteo = m.meteo; }
function couleurNom(nom) { let h = 0; for (const c of nom) h = (h * 31 + c.charCodeAt(0)) >>> 0; const r = mulberry(h); const pal = ['#e5484d', '#2b9be0', '#3fbf55', '#f2b51d', '#8a5cd8', '#ff8a20', '#20c0b0', '#ff5aa0']; return { shirt: hex(pal[Math.floor(r() * pal.length)]), hat: hex(['#f0d080', '#ffffff', '#3a3a3a', '#d8423a', '#2b5f9e'][Math.floor(r() * 5)]) }; }
let MY = { shirt: hex('#2b9be0'), hat: hex('#f0d080') };
async function sync() {
  if (!ME || syncEnCours) return; syncEnCours = true;
  const a = player.swim ? 's' : player.moving ? 'm' : F.st === 'charge' ? 'ch' : (F.st === 'attente' || F.st === 'touche') ? 'p' : F.st === 'combat' ? 'c' : '';
  const bt = myBoat ? { t: myBoat.t, x: myBoat.x, z: myBoat.z, ry: myBoat.ry, on: myBoat.on } : null;
  const r = await api('/api/sync', { x: player.x, y: player.y, z: player.z, ry: player.ry, a, rod: player.rodOut, bt, srv: wantSrv, b: (F.st === 'attente' || F.st === 'touche' || F.st === 'combat') ? F.bob : null, depuis: annSince });
  syncEnCours = false;
  if (!r || r.err) return;
  const ancienneMeteo = meteo;
  if (wantSrv && r.srv === wantSrv) wantSrv = 0;
  if (monSrv && r.srv !== monSrv) { autres = {}; toast('🌐 Tu es maintenant sur le serveur ' + r.srv); }
  monSrv = r.srv; $('srvHud').textContent = '🌐 Serveur ' + r.srv + ' • ' + r.nSrv + '/' + r.maxSrv + ' joueurs';
  if (ME.role !== r.role) { ME.role = r.role; majHUD(); }
  if (r.demandes !== nbDemandes) { if (r.demandes > nbDemandes) toast('👥 Tu as une nouvelle demande d\\'ami ! (touche 0)'); nbDemandes = r.demandes; majHUD(); }
  const bo = r.monde && r.monde.boost; $('boostHud').textContent = bo ? '🍀 Boost chance ×' + bo.mult + ' (' + Math.ceil(bo.reste / 60000) + ' min)' : '';
  setMonde(r.monde);
  for (const an of r.annonces || []) { toast(an.txt, 4500); annSince = Math.max(annSince, an.t); }
  if (r.now && annSince < r.now - 60000) annSince = r.now - 60000;
  const vus = {};
  for (const o of r.autres) {
    vus[o.nom] = 1; let a2 = autres[o.nom];
    if (!a2) { a2 = autres[o.nom] = Object.assign({ x: o.x, y: o.y, z: o.z, ry: o.ry }, couleurNom(o.nom)); }
    a2.tx = o.x; a2.ty = o.y; a2.tz = o.z; a2.try = o.ry; a2.a = o.a; a2.b = o.b; a2.canne = o.canne; a2.bt = o.bt; a2.rod = o.rod; a2.role = o.role;
  }
  for (const k in autres) if (!vus[k]) delete autres[k];
}

// =====================================================================
//  CONNEXION + DÉMARRAGE
// =====================================================================
async function entrer(r) {
  if (r.err) { $('lmsg').textContent = r.err; if (r.code) $('lcode').classList.remove('hide'); return; }
  TOKEN = r.token; localStorage.setItem('fs_token', TOKEN); demarrer(r.etat);
}
$('bJouer').onclick = async () => entrer(await api('/api/connexion', { nom: $('lnom').value, pass: $('lpass').value, code: $('lcode').value }));
$('bCreer').onclick = async () => entrer(await api('/api/inscription', { nom: $('lnom').value, pass: $('lpass').value, code: $('lcode').value }));
$('lpass').addEventListener('keydown', e => { if (e.key === 'Enter') $('bJouer').click(); });
let syncTimer = null;
function demarrer(etat) {
  setEtat(etat); MY = couleurNom(ME.nom);
  $('login').classList.add('hide'); $('jeu').classList.remove('hide');
  player.x = 29; player.z = 0.5; player.y = groundY(29, 0.5); player.ry = Math.PI / 2; cam.yaw = -Math.PI / 2;
  if (!syncTimer) syncTimer = setInterval(sync, 220);
  if (!localStorage.getItem('fs_vu')) { localStorage.setItem('fs_vu', 1); setTimeout(() => toast('👋 Bienvenue ' + ME.nom + ' ! Va au bout du ponton et maintiens le clic pour lancer ta ligne 🎣', 6500), 500); }
}
function makeHeightTex() {
  const R = 512, data = new Uint8Array(R * R);
  for (let j = 0; j < R; j++) for (let i = 0; i < R; i++) { const x = -420 + (i + 0.5) / R * 840, z = -420 + (j + 0.5) / R * 840; data[j * R + i] = Math.round(clamp((H(x, z) + 10) / 30, 0, 1) * 255); }
  const tex = gl.createTexture(); HTEX = tex; gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, R, R, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, data);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.uniform1i(U.hmap, 0);
}
(async function init() {
  try {
    W = buildWorld(); CH = buildChar(); BOATS = buildBoats(); makeHeightTex();
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
