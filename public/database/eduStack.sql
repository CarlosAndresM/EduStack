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
    email VARCHAR(100) NOT NULL,
    password VARCHAR(100) NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    company VARCHAR(100) NOT NULL,
    educational_level_id INT,
    agreed_terms TINYINT(1) NOT NULL,
    promotional_offers TINYINT(1) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (educational_level_id) REFERENCES niveles_educativos(id)
);
