-- phpMyAdmin SQL Dump
-- version 4.0.10deb1
-- http://www.phpmyadmin.net
--
-- Client: 127.0.0.1
-- Généré le: Dim 03 Mai 2015 à 21:03
-- Version du serveur: 5.5.40-0ubuntu0.14.04.1
-- Version de PHP: 5.5.9-1ubuntu4.5

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;

--
-- Base de données: `CalendrierFrancoisMikael`
--
CREATE DATABASE IF NOT EXISTS `CalendrierFrancoisMikael` DEFAULT CHARACTER SET utf8 COLLATE utf8_general_ci;
USE `CalendrierFrancoisMikael`;

-- --------------------------------------------------------

--
-- Structure de la table `evenements`
--

CREATE TABLE IF NOT EXISTS `evenements` (
  `debut` time NOT NULL,
  `fin` time NOT NULL,
  `jour` date NOT NULL,
  `login` varchar(255) NOT NULL,
  `titre` varchar(255) NOT NULL,
  `id` varchar(100) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `login` (`login`),
  KEY `titre` (`titre`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Contenu de la table `evenements`
--

INSERT INTO `evenements` (`debut`, `fin`, `jour`, `login`, `titre`, `id`) VALUES
('03:30:00', '05:30:00', '2015-04-27', 'Nash', 'Test', 'De 03:30:00 à 05:30:00 le 2015-04-27 (Nash)'),
('03:30:00', '06:30:00', '2015-04-30', 'Nash', 'Choisissez un titre', 'De 03:30:00 à 06:30:00 le 2015-04-30 (Nash)');

-- --------------------------------------------------------

--
-- Structure de la table `utilisateurs`
--

CREATE TABLE IF NOT EXISTS `utilisateurs` (
  `login` varchar(255) NOT NULL,
  `pass` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`login`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Contenu de la table `utilisateurs`
--

INSERT INTO `utilisateurs` (`login`, `pass`) VALUES
('Lind', 'user2'),
('Nash', 'user1');

--
-- Contraintes pour les tables exportées
--

--
-- Contraintes pour la table `evenements`
--
ALTER TABLE `evenements`
  ADD CONSTRAINT `evenements_ibfk_1` FOREIGN KEY (`login`) REFERENCES `utilisateurs` (`login`);

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
