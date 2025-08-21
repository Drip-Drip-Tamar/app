-- Drip Drip Tamar - Initial Database Schema
-- Water quality monitoring for the Tamar River

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create enum for parameter types
CREATE TYPE parameter AS ENUM ('e_coli','intestinal_enterococci');

-- Sites table: monitoring locations along the Tamar River
CREATE TABLE sites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    lat DECIMAL(10, 8),
    lng DECIMAL(11, 8),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Samples table: water samples collected at sites
CREATE TABLE samples (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
    sampled_at TIMESTAMPTZ NOT NULL,
    rainfall_24h_mm NUMERIC(5, 2),
    rainfall_72h_mm NUMERIC(5, 2),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Results table: bacterial test results for each sample
CREATE TABLE results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sample_id UUID REFERENCES samples(id) ON DELETE CASCADE,
    param parameter NOT NULL,
    value NUMERIC(10, 2) NOT NULL,
    unit VARCHAR(50) DEFAULT 'CFU/100ml',
    qa_flag VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(sample_id, param)
);

-- Indexes for performance
CREATE INDEX idx_samples_site_date ON samples(site_id, sampled_at DESC);
CREATE INDEX idx_results_sample_param ON results(sample_id, param);
CREATE INDEX idx_sites_slug ON sites(slug);

-- Initial sites for the Tamar River monitoring project
INSERT INTO sites (slug, name, lat, lng, notes) VALUES
    ('okel-tor', 'Okel Tor', 50.5167, -4.2167, 'Popular swimming spot near Callington'),
    ('calstock', 'Calstock Quay', 50.5167, -4.2000, 'Village quay area on the Tamar River');

-- Sample test data for development and testing
-- Adding realistic E. coli and Enterococci readings
INSERT INTO samples (site_id, sampled_at, rainfall_24h_mm, rainfall_72h_mm, notes) VALUES
    ((SELECT id FROM sites WHERE slug = 'okel-tor'), '2024-01-15 10:00:00+00', 2.5, 8.2, 'Clear day, calm water'),
    ((SELECT id FROM sites WHERE slug = 'okel-tor'), '2024-01-22 11:30:00+00', 0.0, 1.2, 'Sunny conditions'),
    ((SELECT id FROM sites WHERE slug = 'okel-tor'), '2024-01-29 09:45:00+00', 15.8, 22.4, 'After heavy rain'),
    ((SELECT id FROM sites WHERE slug = 'okel-tor'), '2024-02-05 10:15:00+00', 0.8, 3.1, 'Light morning mist'),
    ((SELECT id FROM sites WHERE slug = 'okel-tor'), '2024-02-12 11:00:00+00', 0.0, 0.5, 'Dry spell'),
    ((SELECT id FROM sites WHERE slug = 'okel-tor'), '2024-02-19 10:30:00+00', 8.4, 12.7, 'Moderate rainfall'),
    ((SELECT id FROM sites WHERE slug = 'okel-tor'), '2024-02-26 09:30:00+00', 1.2, 4.8, 'Overcast morning'),
    ((SELECT id FROM sites WHERE slug = 'okel-tor'), '2024-03-05 10:45:00+00', 0.0, 0.2, 'Clear and cold'),
    ((SELECT id FROM sites WHERE slug = 'okel-tor'), '2024-03-12 11:15:00+00', 5.6, 9.3, 'Spring showers'),
    ((SELECT id FROM sites WHERE slug = 'okel-tor'), '2024-03-19 10:00:00+00', 0.3, 2.1, 'Partly cloudy'),
    
    ((SELECT id FROM sites WHERE slug = 'calstock'), '2024-01-16 14:00:00+00', 3.1, 9.5, 'High tide sampling'),
    ((SELECT id FROM sites WHERE slug = 'calstock'), '2024-01-23 13:45:00+00', 0.2, 1.8, 'Low tide, clear water'),
    ((SELECT id FROM sites WHERE slug = 'calstock'), '2024-01-30 14:30:00+00', 18.2, 28.6, 'Post-storm conditions'),
    ((SELECT id FROM sites WHERE slug = 'calstock'), '2024-02-06 13:15:00+00', 1.1, 4.2, 'Normal flow'),
    ((SELECT id FROM sites WHERE slug = 'calstock'), '2024-02-13 14:00:00+00', 0.0, 0.8, 'Dry conditions'),
    ((SELECT id FROM sites WHERE slug = 'calstock'), '2024-02-20 13:30:00+00', 9.7, 15.3, 'Recent rain'),
    ((SELECT id FROM sites WHERE slug = 'calstock'), '2024-02-27 14:15:00+00', 2.1, 6.4, 'Cloudy afternoon'),
    ((SELECT id FROM sites WHERE slug = 'calstock'), '2024-03-06 13:45:00+00', 0.1, 0.4, 'Bright and calm'),
    ((SELECT id FROM sites WHERE slug = 'calstock'), '2024-03-13 14:30:00+00', 6.8, 11.2, 'Variable weather'),
    ((SELECT id FROM sites WHERE slug = 'calstock'), '2024-03-20 13:00:00+00', 0.5, 3.2, 'Light breeze');

-- Insert E. coli results (realistic ranges: 10-500 CFU/100ml normal, >1000 concerning)
INSERT INTO results (sample_id, param, value, unit) VALUES
    -- Okel Tor E. coli results
    ((SELECT id FROM samples WHERE site_id = (SELECT id FROM sites WHERE slug = 'okel-tor') AND sampled_at = '2024-01-15 10:00:00+00'), 'e_coli', 45.0, 'CFU/100ml'),
    ((SELECT id FROM samples WHERE site_id = (SELECT id FROM sites WHERE slug = 'okel-tor') AND sampled_at = '2024-01-22 11:30:00+00'), 'e_coli', 28.0, 'CFU/100ml'),
    ((SELECT id FROM samples WHERE site_id = (SELECT id FROM sites WHERE slug = 'okel-tor') AND sampled_at = '2024-01-29 09:45:00+00'), 'e_coli', 1240.0, 'CFU/100ml'),
    ((SELECT id FROM samples WHERE site_id = (SELECT id FROM sites WHERE slug = 'okel-tor') AND sampled_at = '2024-02-05 10:15:00+00'), 'e_coli', 67.0, 'CFU/100ml'),
    ((SELECT id FROM samples WHERE site_id = (SELECT id FROM sites WHERE slug = 'okel-tor') AND sampled_at = '2024-02-12 11:00:00+00'), 'e_coli', 22.0, 'CFU/100ml'),
    ((SELECT id FROM samples WHERE site_id = (SELECT id FROM sites WHERE slug = 'okel-tor') AND sampled_at = '2024-02-19 10:30:00+00'), 'e_coli', 380.0, 'CFU/100ml'),
    ((SELECT id FROM samples WHERE site_id = (SELECT id FROM sites WHERE slug = 'okel-tor') AND sampled_at = '2024-02-26 09:30:00+00'), 'e_coli', 95.0, 'CFU/100ml'),
    ((SELECT id FROM samples WHERE site_id = (SELECT id FROM sites WHERE slug = 'okel-tor') AND sampled_at = '2024-03-05 10:45:00+00'), 'e_coli', 18.0, 'CFU/100ml'),
    ((SELECT id FROM samples WHERE site_id = (SELECT id FROM sites WHERE slug = 'okel-tor') AND sampled_at = '2024-03-12 11:15:00+00'), 'e_coli', 156.0, 'CFU/100ml'),
    ((SELECT id FROM samples WHERE site_id = (SELECT id FROM sites WHERE slug = 'okel-tor') AND sampled_at = '2024-03-19 10:00:00+00'), 'e_coli', 42.0, 'CFU/100ml'),
    
    -- Calstock E. coli results
    ((SELECT id FROM samples WHERE site_id = (SELECT id FROM sites WHERE slug = 'calstock') AND sampled_at = '2024-01-16 14:00:00+00'), 'e_coli', 52.0, 'CFU/100ml'),
    ((SELECT id FROM samples WHERE site_id = (SELECT id FROM sites WHERE slug = 'calstock') AND sampled_at = '2024-01-23 13:45:00+00'), 'e_coli', 31.0, 'CFU/100ml'),
    ((SELECT id FROM samples WHERE site_id = (SELECT id FROM sites WHERE slug = 'calstock') AND sampled_at = '2024-01-30 14:30:00+00'), 'e_coli', 1580.0, 'CFU/100ml'),
    ((SELECT id FROM samples WHERE site_id = (SELECT id FROM sites WHERE slug = 'calstock') AND sampled_at = '2024-02-06 13:15:00+00'), 'e_coli', 74.0, 'CFU/100ml'),
    ((SELECT id FROM samples WHERE site_id = (SELECT id FROM sites WHERE slug = 'calstock') AND sampled_at = '2024-02-13 14:00:00+00'), 'e_coli', 19.0, 'CFU/100ml'),
    ((SELECT id FROM samples WHERE site_id = (SELECT id FROM sites WHERE slug = 'calstock') AND sampled_at = '2024-02-20 13:30:00+00'), 'e_coli', 425.0, 'CFU/100ml'),
    ((SELECT id FROM samples WHERE site_id = (SELECT id FROM sites WHERE slug = 'calstock') AND sampled_at = '2024-02-27 14:15:00+00'), 'e_coli', 108.0, 'CFU/100ml'),
    ((SELECT id FROM samples WHERE site_id = (SELECT id FROM sites WHERE slug = 'calstock') AND sampled_at = '2024-03-06 13:45:00+00'), 'e_coli', 25.0, 'CFU/100ml'),
    ((SELECT id FROM samples WHERE site_id = (SELECT id FROM sites WHERE slug = 'calstock') AND sampled_at = '2024-03-13 14:30:00+00'), 'e_coli', 189.0, 'CFU/100ml'),
    ((SELECT id FROM samples WHERE site_id = (SELECT id FROM sites WHERE slug = 'calstock') AND sampled_at = '2024-03-20 13:00:00+00'), 'e_coli', 58.0, 'CFU/100ml');

-- Insert Intestinal Enterococci results (typically lower than E. coli)
INSERT INTO results (sample_id, param, value, unit) VALUES
    -- Okel Tor Enterococci results
    ((SELECT id FROM samples WHERE site_id = (SELECT id FROM sites WHERE slug = 'okel-tor') AND sampled_at = '2024-01-15 10:00:00+00'), 'intestinal_enterococci', 12.0, 'CFU/100ml'),
    ((SELECT id FROM samples WHERE site_id = (SELECT id FROM sites WHERE slug = 'okel-tor') AND sampled_at = '2024-01-22 11:30:00+00'), 'intestinal_enterococci', 8.0, 'CFU/100ml'),
    ((SELECT id FROM samples WHERE site_id = (SELECT id FROM sites WHERE slug = 'okel-tor') AND sampled_at = '2024-01-29 09:45:00+00'), 'intestinal_enterococci', 185.0, 'CFU/100ml'),
    ((SELECT id FROM samples WHERE site_id = (SELECT id FROM sites WHERE slug = 'okel-tor') AND sampled_at = '2024-02-05 10:15:00+00'), 'intestinal_enterococci', 18.0, 'CFU/100ml'),
    ((SELECT id FROM samples WHERE site_id = (SELECT id FROM sites WHERE slug = 'okel-tor') AND sampled_at = '2024-02-12 11:00:00+00'), 'intestinal_enterococci', 6.0, 'CFU/100ml'),
    ((SELECT id FROM samples WHERE site_id = (SELECT id FROM sites WHERE slug = 'okel-tor') AND sampled_at = '2024-02-19 10:30:00+00'), 'intestinal_enterococci', 62.0, 'CFU/100ml'),
    ((SELECT id FROM samples WHERE site_id = (SELECT id FROM sites WHERE slug = 'okel-tor') AND sampled_at = '2024-02-26 09:30:00+00'), 'intestinal_enterococci', 24.0, 'CFU/100ml'),
    ((SELECT id FROM samples WHERE site_id = (SELECT id FROM sites WHERE slug = 'okel-tor') AND sampled_at = '2024-03-05 10:45:00+00'), 'intestinal_enterococci', 4.0, 'CFU/100ml'),
    ((SELECT id FROM samples WHERE site_id = (SELECT id FROM sites WHERE slug = 'okel-tor') AND sampled_at = '2024-03-12 11:15:00+00'), 'intestinal_enterococci', 31.0, 'CFU/100ml'),
    ((SELECT id FROM samples WHERE site_id = (SELECT id FROM sites WHERE slug = 'okel-tor') AND sampled_at = '2024-03-19 10:00:00+00'), 'intestinal_enterococci', 11.0, 'CFU/100ml'),
    
    -- Calstock Enterococci results
    ((SELECT id FROM samples WHERE site_id = (SELECT id FROM sites WHERE slug = 'calstock') AND sampled_at = '2024-01-16 14:00:00+00'), 'intestinal_enterococci', 14.0, 'CFU/100ml'),
    ((SELECT id FROM samples WHERE site_id = (SELECT id FROM sites WHERE slug = 'calstock') AND sampled_at = '2024-01-23 13:45:00+00'), 'intestinal_enterococci', 9.0, 'CFU/100ml'),
    ((SELECT id FROM samples WHERE site_id = (SELECT id FROM sites WHERE slug = 'calstock') AND sampled_at = '2024-01-30 14:30:00+00'), 'intestinal_enterococci', 225.0, 'CFU/100ml'),
    ((SELECT id FROM samples WHERE site_id = (SELECT id FROM sites WHERE slug = 'calstock') AND sampled_at = '2024-02-06 13:15:00+00'), 'intestinal_enterococci', 20.0, 'CFU/100ml'),
    ((SELECT id FROM samples WHERE site_id = (SELECT id FROM sites WHERE slug = 'calstock') AND sampled_at = '2024-02-13 14:00:00+00'), 'intestinal_enterococci', 5.0, 'CFU/100ml'),
    ((SELECT id FROM samples WHERE site_id = (SELECT id FROM sites WHERE slug = 'calstock') AND sampled_at = '2024-02-20 13:30:00+00'), 'intestinal_enterococci', 68.0, 'CFU/100ml'),
    ((SELECT id FROM samples WHERE site_id = (SELECT id FROM sites WHERE slug = 'calstock') AND sampled_at = '2024-02-27 14:15:00+00'), 'intestinal_enterococci', 28.0, 'CFU/100ml'),
    ((SELECT id FROM samples WHERE site_id = (SELECT id FROM sites WHERE slug = 'calstock') AND sampled_at = '2024-03-06 13:45:00+00'), 'intestinal_enterococci', 7.0, 'CFU/100ml'),
    ((SELECT id FROM samples WHERE site_id = (SELECT id FROM sites WHERE slug = 'calstock') AND sampled_at = '2024-03-13 14:30:00+00'), 'intestinal_enterococci', 35.0, 'CFU/100ml'),
    ((SELECT id FROM samples WHERE site_id = (SELECT id FROM sites WHERE slug = 'calstock') AND sampled_at = '2024-03-20 13:00:00+00'), 'intestinal_enterococci', 16.0, 'CFU/100ml');