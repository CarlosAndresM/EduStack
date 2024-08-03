CREATE TABLE niveles_educativos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL
);


INSERT INTO niveles_educativos (nombre) VALUES
('No especificado'),
('Primaria'),
('Secundaria'),
('Técnico'),
('Estudiante Universitario'),
('Especialista');


CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(100) NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    userName VARCHAR(100) NOT NULL,
    educational_level_id INT NOT NULL,
    agreed_terms TINYINT(1) NOT NULL,
    promotional_offers TINYINT(1) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (educational_level_id) REFERENCES niveles_educativos(id)
);

CREATE TABLE usuarios_temporales (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(100) NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    userName VARCHAR(100) NOT NULL,
    educational_level_id INT NOT NULL,
    agreed_terms TINYINT(1) NOT NULL,
    promotional_offers TINYINT(1) NOT NULL,
    verification_code VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
