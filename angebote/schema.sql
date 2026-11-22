CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(80) NOT NULL,
  email VARCHAR(190) NOT NULL UNIQUE,
  pass_hash VARCHAR(255) NOT NULL,
  role ENUM('admin','mitarbeit','lesen') NOT NULL DEFAULT 'mitarbeit',
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL,
  last_login DATETIME NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS login_attempts (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  ip VARCHAR(45) NOT NULL,
  email VARCHAR(190) NOT NULL,
  ts DATETIME NOT NULL,
  INDEX (ip), INDEX (email), INDEX (ts)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Katalog: alle Artikel mit Beschreibung und Listenpreis
CREATE TABLE IF NOT EXISTS artikel (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nr VARCHAR(40) NOT NULL UNIQUE,
  bezeichnung VARCHAR(200) NOT NULL,
  beschreibung TEXT NULL,
  kategorie VARCHAR(80) NOT NULL DEFAULT '',
  preis DECIMAL(12,2) NOT NULL DEFAULT 0,
  einheit VARCHAR(20) NOT NULL DEFAULT 'Stk.',
  aktiv TINYINT(1) NOT NULL DEFAULT 1,
  updated_at DATETIME NOT NULL,
  INDEX (kategorie)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Welche Artikel zusammenpassen: passt (beidseitig), benoetigt (von braucht zu), ausschluss (beidseitig)
CREATE TABLE IF NOT EXISTS artikel_beziehung (
  von_id INT UNSIGNED NOT NULL,
  zu_id INT UNSIGNED NOT NULL,
  typ ENUM('passt','benoetigt','ausschluss') NOT NULL,
  PRIMARY KEY (von_id, zu_id, typ),
  INDEX (zu_id),
  FOREIGN KEY (von_id) REFERENCES artikel(id) ON DELETE CASCADE,
  FOREIGN KEY (zu_id) REFERENCES artikel(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS angebote (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nummer VARCHAR(30) NOT NULL UNIQUE,
  titel VARCHAR(200) NOT NULL DEFAULT '',
  kunde_firma VARCHAR(200) NOT NULL DEFAULT '',
  kunde_kontakt VARCHAR(120) NOT NULL DEFAULT '',
  kunde_email VARCHAR(190) NOT NULL DEFAULT '',
  kunde_adresse TEXT NULL,
  status ENUM('entwurf','versendet','gewonnen','verloren') NOT NULL DEFAULT 'entwurf',
  datum DATE NOT NULL,
  gueltig_bis DATE NULL,
  rabatt DECIMAL(5,2) NOT NULL DEFAULT 0,
  einleitung TEXT NULL,
  notiz_intern TEXT NULL,
  erstellt_von VARCHAR(80) NOT NULL DEFAULT '',
  bearbeitet_von VARCHAR(80) NOT NULL DEFAULT '',
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  INDEX (updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Positionen werden als Kopie gespeichert, damit spaetere Katalogaenderungen alte Angebote nicht veraendern
CREATE TABLE IF NOT EXISTS angebot_positionen (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  angebot_id INT UNSIGNED NOT NULL,
  pos INT UNSIGNED NOT NULL DEFAULT 0,
  artikel_id INT UNSIGNED NULL,
  nr VARCHAR(40) NOT NULL DEFAULT '',
  bezeichnung VARCHAR(200) NOT NULL DEFAULT '',
  beschreibung TEXT NULL,
  menge DECIMAL(10,2) NOT NULL DEFAULT 1,
  einheit VARCHAR(20) NOT NULL DEFAULT 'Stk.',
  preis DECIMAL(12,2) NOT NULL DEFAULT 0,
  rabatt DECIMAL(5,2) NOT NULL DEFAULT 0,
  optional TINYINT(1) NOT NULL DEFAULT 0,
  INDEX (angebot_id),
  FOREIGN KEY (angebot_id) REFERENCES angebote(id) ON DELETE CASCADE,
  FOREIGN KEY (artikel_id) REFERENCES artikel(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS einstellungen (
  k VARCHAR(40) NOT NULL PRIMARY KEY,
  v TEXT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
