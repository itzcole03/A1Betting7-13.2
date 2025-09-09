CREATE TABLE alembic_version (
    version_num VARCHAR(32) NOT NULL, 
    CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num)
);

-- Running upgrade  -> 37f2139975d0

INSERT INTO alembic_version (version_num) VALUES ('37f2139975d0') RETURNING version_num;

-- Running upgrade 37f2139975d0 -> 079780825cba

UPDATE alembic_version SET version_num='079780825cba' WHERE alembic_version.version_num = '37f2139975d0';

-- Running upgrade 079780825cba -> a488fec67a2b

CREATE TABLE casinos (
    id INTEGER NOT NULL, 
    name VARCHAR NOT NULL, 
    "key" VARCHAR NOT NULL, 
    PRIMARY KEY (id), 
    UNIQUE ("key")
);

CREATE TABLE matches (
    id INTEGER NOT NULL, 
    home_team VARCHAR NOT NULL, 
    away_team VARCHAR NOT NULL, 
    sport VARCHAR NOT NULL, 
    league VARCHAR NOT NULL, 
    season VARCHAR, 
    week INTEGER, 
    start_time DATETIME NOT NULL, 
    end_time DATETIME, 
    status VARCHAR, 
    home_score INTEGER, 
    away_score INTEGER, 
    venue VARCHAR, 
    weather_conditions VARCHAR, 
    temperature FLOAT, 
    external_id VARCHAR, 
    sportsradar_id VARCHAR, 
    the_odds_api_id VARCHAR, 
    is_featured BOOLEAN, 
    has_live_odds BOOLEAN, 
    created_at DATETIME, 
    updated_at DATETIME, 
    PRIMARY KEY (id)
);

CREATE INDEX ix_matches_id ON matches (id);

CREATE TABLE game_spreads (
    id INTEGER NOT NULL, 
    match_id INTEGER, 
    casino_id INTEGER, 
    spread NUMERIC(4, 1), 
    home_team_line NUMERIC(5, 2), 
    away_team_line NUMERIC(5, 2), 
    update_time TIMESTAMP, 
    PRIMARY KEY (id), 
    FOREIGN KEY(casino_id) REFERENCES casinos (id), 
    FOREIGN KEY(match_id) REFERENCES matches (id)
);

CREATE TABLE scores (
    id INTEGER NOT NULL, 
    match_id INTEGER, 
    home_score INTEGER, 
    away_score INTEGER, 
    update_time TIMESTAMP, 
    PRIMARY KEY (id), 
    FOREIGN KEY(match_id) REFERENCES matches (id)
);

UPDATE alembic_version SET version_num='a488fec67a2b' WHERE alembic_version.version_num = '079780825cba';

-- Running upgrade a488fec67a2b -> 6e6dad7a7f13

ALTER TABLE game_spreads ADD COLUMN odds_metadata VARCHAR;

CREATE INDEX ix_game_spreads_casino_id ON game_spreads (casino_id);

CREATE INDEX ix_game_spreads_match_id ON game_spreads (match_id);

CREATE INDEX ix_scores_match_id ON scores (match_id);

UPDATE alembic_version SET version_num='6e6dad7a7f13' WHERE alembic_version.version_num = 'a488fec67a2b';

-- Running upgrade 6e6dad7a7f13 -> 504fcf5dc2f5

UPDATE alembic_version SET version_num='504fcf5dc2f5' WHERE alembic_version.version_num = '6e6dad7a7f13';

-- Running upgrade 504fcf5dc2f5 -> f06f8a0fc07c

CREATE TABLE events (
    id INTEGER NOT NULL, 
    event_id INTEGER NOT NULL, 
    name VARCHAR NOT NULL, 
    start_time DATETIME NOT NULL, 
    provider_id VARCHAR, 
    PRIMARY KEY (id), 
    UNIQUE (event_id)
);

CREATE TABLE teams (
    id INTEGER NOT NULL, 
    name VARCHAR NOT NULL, 
    provider_id VARCHAR, 
    PRIMARY KEY (id), 
    UNIQUE (name)
);

CREATE TABLE odds (
    id INTEGER NOT NULL, 
    event_id INTEGER NOT NULL, 
    team_id INTEGER NOT NULL, 
    odds_type VARCHAR NOT NULL, 
    value FLOAT NOT NULL, 
    provider_id VARCHAR, 
    PRIMARY KEY (id), 
    FOREIGN KEY(event_id) REFERENCES events (id), 
    FOREIGN KEY(team_id) REFERENCES teams (id), 
    CONSTRAINT uq_odds_event_team_type_provider UNIQUE (event_id, team_id, odds_type, provider_id)
);

UPDATE alembic_version SET version_num='f06f8a0fc07c' WHERE alembic_version.version_num = '504fcf5dc2f5';

-- Running upgrade f06f8a0fc07c -> 9beb31b07eb3

CREATE TABLE users (
    id INTEGER NOT NULL, 
    username VARCHAR(50) NOT NULL, 
    email VARCHAR(100) NOT NULL, 
    password_hash VARCHAR(255) NOT NULL, 
    api_key_encrypted VARCHAR(512), 
    first_name VARCHAR(50), 
    last_name VARCHAR(50), 
    is_active BOOLEAN, 
    is_verified BOOLEAN, 
    created_at DATETIME DEFAULT (CURRENT_TIMESTAMP), 
    updated_at DATETIME, 
    PRIMARY KEY (id)
);

CREATE UNIQUE INDEX ix_users_api_key_encrypted ON users (api_key_encrypted);

CREATE UNIQUE INDEX ix_users_email ON users (email);

CREATE INDEX ix_users_id ON users (id);

CREATE UNIQUE INDEX ix_users_username ON users (username);

DROP TABLE casinos;

DROP INDEX ix_matches_id;

DROP TABLE matches;

DROP INDEX ix_scores_match_id;

DROP TABLE scores;

DROP INDEX ix_game_spreads_casino_id;

DROP INDEX ix_game_spreads_match_id;

DROP TABLE game_spreads;

CREATE INDEX ix_odds_event_id ON odds (event_id);

CREATE INDEX ix_odds_team_id ON odds (team_id);

UPDATE alembic_version SET version_num='9beb31b07eb3' WHERE alembic_version.version_num = 'f06f8a0fc07c';

-- Running upgrade 9beb31b07eb3 -> b1573a5e9618

CREATE TABLE correlation_cache_entries (
    id INTEGER NOT NULL, 
    cache_key VARCHAR(128) NOT NULL, 
    entry_type VARCHAR(13) NOT NULL, 
    payload_json JSON NOT NULL, 
    created_at DATETIME NOT NULL, 
    expires_at DATETIME NOT NULL, 
    PRIMARY KEY (id), 
    UNIQUE (cache_key)
);

CREATE INDEX idx_cache_created ON correlation_cache_entries (created_at);

CREATE INDEX idx_cache_key ON correlation_cache_entries (cache_key);

CREATE INDEX idx_cache_type_expires ON correlation_cache_entries (entry_type, expires_at);

CREATE INDEX ix_correlation_cache_entries_id ON correlation_cache_entries (id);

CREATE TABLE correlation_clusters (
    id INTEGER NOT NULL, 
    sport VARCHAR(10) NOT NULL, 
    cluster_key VARCHAR(128) NOT NULL, 
    member_prop_ids JSON NOT NULL, 
    average_internal_r FLOAT NOT NULL, 
    computed_at DATETIME NOT NULL, 
    PRIMARY KEY (id)
);

CREATE INDEX idx_cluster_computed ON correlation_clusters (computed_at);

CREATE INDEX idx_cluster_key ON correlation_clusters (cluster_key);

CREATE INDEX idx_cluster_sport ON correlation_clusters (sport);

CREATE INDEX ix_correlation_clusters_id ON correlation_clusters (id);

CREATE TABLE correlation_factor_models (
    id INTEGER NOT NULL, 
    sport VARCHAR(10) NOT NULL, 
    context_hash VARCHAR(64) NOT NULL, 
    method VARCHAR(7) NOT NULL, 
    factors_json JSON NOT NULL, 
    eigenvalues_json JSON NOT NULL, 
    explained_variance_ratio FLOAT NOT NULL, 
    sample_size INTEGER NOT NULL, 
    version_tag VARCHAR(50) NOT NULL, 
    computed_at DATETIME NOT NULL, 
    PRIMARY KEY (id), 
    CONSTRAINT uq_factor_model UNIQUE (sport, context_hash, method, version_tag)
);

CREATE INDEX idx_factor_computed ON correlation_factor_models (computed_at);

CREATE INDEX idx_factor_method ON correlation_factor_models (method);

CREATE INDEX idx_factor_sport_context ON correlation_factor_models (sport, context_hash);

CREATE INDEX ix_correlation_factor_models_id ON correlation_factor_models (id);

CREATE TABLE historical_prop_outcomes (
    id INTEGER NOT NULL, 
    prop_id INTEGER, 
    player_id INTEGER NOT NULL, 
    prop_type VARCHAR(50) NOT NULL, 
    event_date DATETIME NOT NULL, 
    actual_value FLOAT NOT NULL, 
    source VARCHAR(50) NOT NULL, 
    created_at DATETIME NOT NULL, 
    PRIMARY KEY (id)
);

CREATE INDEX idx_historical_event_date ON historical_prop_outcomes (event_date);

CREATE INDEX idx_historical_player_prop_date ON historical_prop_outcomes (player_id, prop_type, event_date);

CREATE INDEX idx_historical_prop_id ON historical_prop_outcomes (prop_id);

CREATE INDEX idx_historical_source ON historical_prop_outcomes (source);

CREATE INDEX ix_historical_prop_outcomes_id ON historical_prop_outcomes (id);

CREATE TABLE model_versions (
    id INTEGER NOT NULL, 
    name VARCHAR(100) NOT NULL, 
    version_tag VARCHAR(50) NOT NULL, 
    model_type VARCHAR(12) NOT NULL, 
    hyperparams JSON, 
    created_at DATETIME NOT NULL, 
    is_default BOOLEAN NOT NULL, 
    PRIMARY KEY (id)
);

CREATE INDEX idx_model_created ON model_versions (created_at);

CREATE INDEX idx_model_name_version ON model_versions (name, version_tag);

CREATE INDEX idx_model_type ON model_versions (model_type);

CREATE INDEX ix_model_versions_id ON model_versions (id);

CREATE TABLE monte_carlo_runs (
    id INTEGER NOT NULL, 
    run_key VARCHAR(128) NOT NULL, 
    legs_count INTEGER NOT NULL, 
    draws_requested INTEGER NOT NULL, 
    draws_executed INTEGER NOT NULL, 
    variance_estimate FLOAT NOT NULL, 
    ev_independent FLOAT NOT NULL, 
    ev_adjusted FLOAT NOT NULL, 
    prob_joint FLOAT NOT NULL, 
    distribution_snapshots_json JSON NOT NULL, 
    parameters_json JSON NOT NULL, 
    created_at DATETIME NOT NULL, 
    PRIMARY KEY (id), 
    UNIQUE (run_key)
);

CREATE INDEX idx_mc_created ON monte_carlo_runs (created_at);

CREATE INDEX idx_mc_legs_count ON monte_carlo_runs (legs_count);

CREATE INDEX idx_mc_run_key ON monte_carlo_runs (run_key);

CREATE INDEX ix_monte_carlo_runs_id ON monte_carlo_runs (id);

CREATE TABLE optimization_runs (
    id INTEGER NOT NULL, 
    objective VARCHAR(12) NOT NULL, 
    input_edge_ids JSON NOT NULL, 
    constraints_json JSON NOT NULL, 
    solution_ticket_sets JSON, 
    best_score FLOAT, 
    status VARCHAR(7) NOT NULL, 
    error_message TEXT, 
    duration_ms INTEGER, 
    created_at DATETIME NOT NULL, 
    PRIMARY KEY (id)
);

CREATE INDEX idx_opt_best_score ON optimization_runs (best_score);

CREATE INDEX idx_opt_objective ON optimization_runs (objective);

CREATE INDEX idx_opt_status_created ON optimization_runs (status, created_at);

CREATE INDEX ix_optimization_runs_id ON optimization_runs (id);

CREATE TABLE prop_correlation_stats (
    id INTEGER NOT NULL, 
    prop_id_a INTEGER NOT NULL, 
    prop_id_b INTEGER NOT NULL, 
    sport VARCHAR(10) NOT NULL, 
    sample_size INTEGER NOT NULL, 
    pearson_r FLOAT NOT NULL, 
    last_computed_at DATETIME NOT NULL, 
    context_hash VARCHAR(64) NOT NULL, 
    method VARCHAR(20) NOT NULL, 
    PRIMARY KEY (id), 
    CONSTRAINT uq_prop_correlation UNIQUE (prop_id_a, prop_id_b, context_hash)
);

CREATE INDEX idx_correlation_computed ON prop_correlation_stats (last_computed_at);

CREATE INDEX idx_correlation_context ON prop_correlation_stats (context_hash);

CREATE INDEX idx_correlation_prop_pair ON prop_correlation_stats (prop_id_a, prop_id_b);

CREATE INDEX idx_correlation_sport ON prop_correlation_stats (sport);

CREATE INDEX ix_prop_correlation_stats_id ON prop_correlation_stats (id);

CREATE TABLE tickets (
    id INTEGER NOT NULL, 
    user_id INTEGER, 
    status VARCHAR(9) NOT NULL, 
    stake FLOAT NOT NULL, 
    potential_payout FLOAT NOT NULL, 
    estimated_ev FLOAT NOT NULL, 
    legs_count INTEGER NOT NULL, 
    created_at DATETIME NOT NULL, 
    submitted_at DATETIME, 
    PRIMARY KEY (id)
);

CREATE INDEX idx_ticket_status_created ON tickets (status, created_at);

CREATE INDEX idx_ticket_submitted ON tickets (submitted_at);

CREATE INDEX idx_ticket_user_status ON tickets (user_id, status);

CREATE INDEX ix_tickets_id ON tickets (id);

CREATE TABLE alert_rules (
    id INTEGER NOT NULL, 
    user_id VARCHAR NOT NULL, 
    rule_type VARCHAR(17) NOT NULL, 
    name VARCHAR(100) NOT NULL, 
    description VARCHAR(500), 
    params JSON NOT NULL, 
    active BOOLEAN NOT NULL, 
    created_at DATETIME NOT NULL, 
    last_triggered_at DATETIME, 
    trigger_count INTEGER NOT NULL, 
    cooldown_minutes INTEGER NOT NULL, 
    PRIMARY KEY (id), 
    FOREIGN KEY(user_id) REFERENCES users (id)
);

CREATE INDEX ix_alert_rules_active ON alert_rules (active);

CREATE INDEX ix_alert_rules_id ON alert_rules (id);

CREATE INDEX ix_alert_rules_user ON alert_rules (user_id);

CREATE INDEX ix_alert_rules_user_id ON alert_rules (user_id);

CREATE TABLE bankroll_profiles (
    id INTEGER NOT NULL, 
    user_id VARCHAR NOT NULL, 
    strategy VARCHAR(16) NOT NULL, 
    base_bankroll FLOAT NOT NULL, 
    current_bankroll FLOAT NOT NULL, 
    kelly_fraction FLOAT, 
    flat_unit FLOAT, 
    last_updated_at DATETIME NOT NULL, 
    max_stake_pct FLOAT NOT NULL, 
    min_stake FLOAT NOT NULL, 
    PRIMARY KEY (id), 
    FOREIGN KEY(user_id) REFERENCES users (id)
);

CREATE INDEX ix_bankroll_profiles_id ON bankroll_profiles (id);

CREATE INDEX ix_bankroll_profiles_user_id ON bankroll_profiles (user_id);

CREATE INDEX ix_bankroll_user ON bankroll_profiles (user_id);

CREATE TABLE exposure_snapshots (
    id INTEGER NOT NULL, 
    user_id VARCHAR NOT NULL, 
    date DATE NOT NULL, 
    player_id VARCHAR, 
    prop_type VARCHAR(50), 
    correlation_cluster_id INTEGER, 
    total_staked FLOAT NOT NULL, 
    tickets_count INTEGER NOT NULL, 
    created_at DATETIME NOT NULL, 
    PRIMARY KEY (id), 
    FOREIGN KEY(user_id) REFERENCES users (id)
);

CREATE INDEX ix_exposure_composite ON exposure_snapshots (user_id, date, player_id, prop_type, correlation_cluster_id);

CREATE INDEX ix_exposure_snapshots_correlation_cluster_id ON exposure_snapshots (correlation_cluster_id);

CREATE INDEX ix_exposure_snapshots_date ON exposure_snapshots (date);

CREATE INDEX ix_exposure_snapshots_id ON exposure_snapshots (id);

CREATE INDEX ix_exposure_snapshots_player_id ON exposure_snapshots (player_id);

CREATE INDEX ix_exposure_snapshots_prop_type ON exposure_snapshots (prop_type);

CREATE INDEX ix_exposure_snapshots_user_id ON exposure_snapshots (user_id);

CREATE INDEX ix_exposure_user_date ON exposure_snapshots (user_id, date);

CREATE TABLE model_predictions (
    id INTEGER NOT NULL, 
    model_version_id INTEGER NOT NULL, 
    prop_id INTEGER NOT NULL, 
    player_id INTEGER NOT NULL, 
    prop_type VARCHAR(50) NOT NULL, 
    mean FLOAT NOT NULL, 
    variance FLOAT NOT NULL, 
    distribution_family VARCHAR(12) NOT NULL, 
    sample_size INTEGER, 
    features_hash VARCHAR(64) NOT NULL, 
    generated_at DATETIME NOT NULL, 
    PRIMARY KEY (id), 
    FOREIGN KEY(model_version_id) REFERENCES model_versions (id)
);

CREATE INDEX idx_prediction_generated ON model_predictions (generated_at);

CREATE INDEX idx_prediction_player ON model_predictions (player_id);

CREATE INDEX idx_prediction_prop_model ON model_predictions (prop_id, model_version_id);

CREATE INDEX idx_prediction_prop_type ON model_predictions (prop_type);

CREATE INDEX ix_model_predictions_id ON model_predictions (id);

CREATE TABLE model_prop_type_defaults (
    id INTEGER NOT NULL, 
    model_version_id INTEGER NOT NULL, 
    prop_type VARCHAR(50) NOT NULL, 
    active BOOLEAN NOT NULL, 
    assigned_at DATETIME NOT NULL, 
    PRIMARY KEY (id), 
    FOREIGN KEY(model_version_id) REFERENCES model_versions (id), 
    CONSTRAINT uq_model_prop_type UNIQUE (model_version_id, prop_type)
);

CREATE INDEX idx_prop_type_active ON model_prop_type_defaults (prop_type, active);

CREATE INDEX ix_model_prop_type_defaults_id ON model_prop_type_defaults (id);

CREATE TABLE optimization_artifacts (
    id INTEGER NOT NULL, 
    optimization_run_id INTEGER NOT NULL, 
    artifact_type VARCHAR(16) NOT NULL, 
    content JSON NOT NULL, 
    created_at DATETIME NOT NULL, 
    PRIMARY KEY (id), 
    FOREIGN KEY(optimization_run_id) REFERENCES optimization_runs (id)
);

CREATE INDEX idx_artifact_created ON optimization_artifacts (created_at);

CREATE INDEX idx_artifact_run_type ON optimization_artifacts (optimization_run_id, artifact_type);

CREATE INDEX ix_optimization_artifacts_id ON optimization_artifacts (id);

CREATE TABLE recommended_stakes (
    id INTEGER NOT NULL, 
    user_id VARCHAR NOT NULL, 
    edge_id INTEGER NOT NULL, 
    strategy_version VARCHAR(50) NOT NULL, 
    recommended_stake FLOAT NOT NULL, 
    confidence FLOAT NOT NULL, 
    rationale VARCHAR(1000), 
    rationale_hash VARCHAR(64) NOT NULL, 
    created_at DATETIME NOT NULL, 
    expires_at DATETIME NOT NULL, 
    kelly_multiplier FLOAT, 
    risk_adjustment FLOAT, 
    exposure_constraint FLOAT, 
    PRIMARY KEY (id), 
    FOREIGN KEY(user_id) REFERENCES users (id), 
    CONSTRAINT uq_stake_recommendation UNIQUE (user_id, edge_id, strategy_version)
);

CREATE INDEX ix_recommended_stakes_edge_id ON recommended_stakes (edge_id);

CREATE INDEX ix_recommended_stakes_expires_at ON recommended_stakes (expires_at);

CREATE INDEX ix_recommended_stakes_id ON recommended_stakes (id);

CREATE INDEX ix_recommended_stakes_user_id ON recommended_stakes (user_id);

CREATE INDEX ix_stake_expiry ON recommended_stakes (expires_at);

CREATE INDEX ix_stake_user_edge ON recommended_stakes (user_id, edge_id);

CREATE TABLE user_interest_signals (
    id INTEGER NOT NULL, 
    user_id VARCHAR NOT NULL, 
    player_id VARCHAR, 
    prop_type VARCHAR(50), 
    signal_type VARCHAR(19) NOT NULL, 
    weight FLOAT NOT NULL, 
    context JSON, 
    created_at DATETIME NOT NULL, 
    PRIMARY KEY (id), 
    FOREIGN KEY(user_id) REFERENCES users (id)
);

CREATE INDEX ix_interest_composite ON user_interest_signals (user_id, player_id, prop_type);

CREATE INDEX ix_interest_signals_date ON user_interest_signals (user_id, created_at);

CREATE INDEX ix_interest_signals_type ON user_interest_signals (signal_type);

CREATE INDEX ix_user_interest_signals_created_at ON user_interest_signals (created_at);

CREATE INDEX ix_user_interest_signals_id ON user_interest_signals (id);

CREATE INDEX ix_user_interest_signals_player_id ON user_interest_signals (player_id);

CREATE INDEX ix_user_interest_signals_prop_type ON user_interest_signals (prop_type);

CREATE INDEX ix_user_interest_signals_user_id ON user_interest_signals (user_id);

CREATE TABLE watchlists (
    id INTEGER NOT NULL, 
    user_id VARCHAR NOT NULL, 
    name VARCHAR(100) NOT NULL, 
    description VARCHAR(500), 
    created_at DATETIME NOT NULL, 
    is_active BOOLEAN NOT NULL, 
    PRIMARY KEY (id), 
    FOREIGN KEY(user_id) REFERENCES users (id)
);

CREATE INDEX ix_watchlist_user ON watchlists (user_id);

CREATE INDEX ix_watchlists_id ON watchlists (id);

CREATE INDEX ix_watchlists_user_id ON watchlists (user_id);

CREATE TABLE alerts_delivered (
    id INTEGER NOT NULL, 
    user_id VARCHAR NOT NULL, 
    alert_rule_id INTEGER, 
    alert_type VARCHAR(17) NOT NULL, 
    title VARCHAR(200) NOT NULL, 
    content JSON NOT NULL, 
    delivery_channel VARCHAR(7) NOT NULL, 
    status VARCHAR(9) NOT NULL, 
    priority VARCHAR(20) NOT NULL, 
    created_at DATETIME NOT NULL, 
    acknowledged_at DATETIME, 
    expires_at DATETIME, 
    PRIMARY KEY (id), 
    FOREIGN KEY(alert_rule_id) REFERENCES alert_rules (id), 
    FOREIGN KEY(user_id) REFERENCES users (id)
);

CREATE INDEX ix_alerts_created ON alerts_delivered (created_at);

CREATE INDEX ix_alerts_delivered_created_at ON alerts_delivered (created_at);

CREATE INDEX ix_alerts_delivered_id ON alerts_delivered (id);

CREATE INDEX ix_alerts_delivered_status ON alerts_delivered (status);

CREATE INDEX ix_alerts_delivered_user_id ON alerts_delivered (user_id);

CREATE INDEX ix_alerts_status ON alerts_delivered (status);

CREATE INDEX ix_alerts_user ON alerts_delivered (user_id);

CREATE INDEX ix_alerts_user_status ON alerts_delivered (user_id, status);

CREATE TABLE valuations (
    id INTEGER NOT NULL, 
    model_prediction_id INTEGER NOT NULL, 
    prop_id INTEGER NOT NULL, 
    offered_line FLOAT NOT NULL, 
    fair_line FLOAT NOT NULL, 
    prob_over FLOAT NOT NULL, 
    prob_under FLOAT NOT NULL, 
    expected_value FLOAT NOT NULL, 
    payout_schema JSON NOT NULL, 
    volatility_score FLOAT NOT NULL, 
    valuation_hash VARCHAR(64) NOT NULL, 
    created_at DATETIME NOT NULL, 
    PRIMARY KEY (id), 
    FOREIGN KEY(model_prediction_id) REFERENCES model_predictions (id), 
    UNIQUE (valuation_hash), 
    CONSTRAINT uq_valuation_hash UNIQUE (valuation_hash)
);

CREATE INDEX idx_valuation_hash ON valuations (valuation_hash);

CREATE INDEX idx_valuation_prop_model ON valuations (prop_id, model_prediction_id, created_at);

CREATE INDEX ix_valuations_id ON valuations (id);

CREATE TABLE watchlist_items (
    id INTEGER NOT NULL, 
    watchlist_id INTEGER NOT NULL, 
    prop_id VARCHAR, 
    player_id VARCHAR, 
    prop_type VARCHAR(50), 
    notes VARCHAR(500), 
    created_at DATETIME NOT NULL, 
    is_active BOOLEAN NOT NULL, 
    PRIMARY KEY (id), 
    FOREIGN KEY(watchlist_id) REFERENCES watchlists (id), 
    CONSTRAINT uq_watchlist_item UNIQUE (watchlist_id, prop_id, player_id)
);

CREATE INDEX ix_watchlist_items_id ON watchlist_items (id);

CREATE INDEX ix_watchlist_items_player_id ON watchlist_items (player_id);

CREATE INDEX ix_watchlist_items_prop_id ON watchlist_items (prop_id);

CREATE INDEX ix_watchlist_items_prop_type ON watchlist_items (prop_type);

CREATE INDEX ix_watchlist_items_watchlist ON watchlist_items (watchlist_id);

CREATE TABLE edges (
    id INTEGER NOT NULL, 
    valuation_id INTEGER NOT NULL, 
    prop_id INTEGER NOT NULL, 
    model_version_id INTEGER NOT NULL, 
    edge_score FLOAT NOT NULL, 
    ev FLOAT NOT NULL, 
    prob_over FLOAT NOT NULL, 
    offered_line FLOAT NOT NULL, 
    fair_line FLOAT NOT NULL, 
    status VARCHAR(7), 
    correlation_cluster_id INTEGER, 
    created_at DATETIME NOT NULL, 
    retired_at DATETIME, 
    PRIMARY KEY (id), 
    FOREIGN KEY(model_version_id) REFERENCES model_versions (id), 
    FOREIGN KEY(valuation_id) REFERENCES valuations (id)
);

CREATE INDEX idx_edge_correlation ON edges (correlation_cluster_id);

CREATE INDEX idx_edge_prop_model_status ON edges (prop_id, model_version_id, status);

CREATE INDEX idx_edge_score ON edges (edge_score);

CREATE INDEX idx_edge_status_created ON edges (status, created_at);

CREATE INDEX ix_edges_id ON edges (id);

CREATE TABLE explanations (
    id INTEGER NOT NULL, 
    edge_id INTEGER NOT NULL, 
    model_version_id INTEGER NOT NULL, 
    content TEXT NOT NULL, 
    prompt_version VARCHAR(20), 
    provider VARCHAR(50), 
    tokens_used INTEGER, 
    created_at DATETIME NOT NULL, 
    PRIMARY KEY (id), 
    FOREIGN KEY(edge_id) REFERENCES edges (id), 
    FOREIGN KEY(model_version_id) REFERENCES model_versions (id)
);

CREATE INDEX idx_explanation_created ON explanations (created_at);

CREATE INDEX idx_explanation_edge ON explanations (edge_id);

CREATE INDEX idx_explanation_model ON explanations (model_version_id);

CREATE INDEX idx_explanation_model_prompt ON explanations (edge_id, model_version_id, prompt_version);

CREATE INDEX ix_explanations_id ON explanations (id);

CREATE TABLE ticket_legs (
    id INTEGER NOT NULL, 
    ticket_id INTEGER NOT NULL, 
    edge_id INTEGER NOT NULL, 
    prop_id INTEGER NOT NULL, 
    offered_line_snapshot FLOAT NOT NULL, 
    prob_over_snapshot FLOAT NOT NULL, 
    fair_line_snapshot FLOAT NOT NULL, 
    valuation_hash_snapshot VARCHAR(64) NOT NULL, 
    created_at DATETIME NOT NULL, 
    PRIMARY KEY (id), 
    FOREIGN KEY(edge_id) REFERENCES edges (id), 
    FOREIGN KEY(ticket_id) REFERENCES tickets (id)
);

CREATE INDEX idx_ticket_leg_edge ON ticket_legs (edge_id);

CREATE INDEX idx_ticket_leg_prop ON ticket_legs (prop_id);

CREATE INDEX idx_ticket_leg_ticket ON ticket_legs (ticket_id);

CREATE INDEX ix_ticket_legs_id ON ticket_legs (id);

ALTER TABLE users ALTER COLUMN is_active DROP NOT NULL;

ALTER TABLE users ALTER COLUMN is_active TYPE INTEGER;

ALTER TABLE users ALTER COLUMN is_verified DROP NOT NULL;

ALTER TABLE users ALTER COLUMN is_verified TYPE INTEGER;

UPDATE alembic_version SET version_num='b1573a5e9618' WHERE alembic_version.version_num = '9beb31b07eb3';

-- Running upgrade b1573a5e9618 -> c1234567890

CREATE TABLE provider_states (
    id INTEGER NOT NULL, 
    provider_name VARCHAR(100) NOT NULL, 
    sport VARCHAR(20) NOT NULL, 
    status VARCHAR(11) NOT NULL, 
    is_enabled BOOLEAN NOT NULL, 
    poll_interval_seconds INTEGER NOT NULL, 
    timeout_seconds INTEGER NOT NULL, 
    max_retries INTEGER NOT NULL, 
    last_fetch_attempt DATETIME, 
    last_successful_fetch DATETIME, 
    last_error TEXT, 
    consecutive_errors INTEGER NOT NULL, 
    total_requests INTEGER NOT NULL, 
    successful_requests INTEGER NOT NULL, 
    failed_requests INTEGER NOT NULL, 
    average_response_time_ms FLOAT, 
    total_props_fetched INTEGER NOT NULL, 
    unique_props_seen INTEGER NOT NULL, 
    last_prop_count INTEGER, 
    capabilities JSON, 
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL, 
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL, 
    PRIMARY KEY (id)
);

CREATE INDEX ix_provider_states_provider_name ON provider_states (provider_name);

CREATE INDEX ix_provider_states_sport ON provider_states (sport);

CREATE INDEX ix_provider_states_sport_provider ON provider_states (sport, provider_name);

CREATE INDEX ix_provider_states_sport_status ON provider_states (sport, status);

CREATE TABLE portfolio_rationales (
    id INTEGER NOT NULL, 
    request_id VARCHAR(100) NOT NULL, 
    rationale_type VARCHAR(18) NOT NULL, 
    portfolio_data_hash VARCHAR(64) NOT NULL, 
    portfolio_data JSON NOT NULL, 
    context_data JSON, 
    user_preferences JSON, 
    narrative TEXT NOT NULL, 
    key_points JSON NOT NULL, 
    confidence FLOAT NOT NULL, 
    generation_time_ms INTEGER NOT NULL, 
    model_info JSON NOT NULL, 
    prompt_tokens INTEGER, 
    completion_tokens INTEGER, 
    total_cost FLOAT, 
    user_rating INTEGER, 
    user_feedback TEXT, 
    is_flagged BOOLEAN NOT NULL, 
    cache_hits INTEGER NOT NULL, 
    last_accessed DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL, 
    expires_at DATETIME, 
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL, 
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL, 
    PRIMARY KEY (id), 
    UNIQUE (request_id)
);

CREATE INDEX ix_portfolio_rationales_request_id ON portfolio_rationales (request_id);

CREATE INDEX ix_portfolio_rationales_rationale_type ON portfolio_rationales (rationale_type);

CREATE INDEX ix_portfolio_rationales_portfolio_data_hash ON portfolio_rationales (portfolio_data_hash);

CREATE INDEX ix_rationale_type_hash ON portfolio_rationales (rationale_type, portfolio_data_hash);

CREATE INDEX ix_rationale_expires_at ON portfolio_rationales (expires_at);

CREATE INDEX ix_rationale_created_at ON portfolio_rationales (created_at);

UPDATE alembic_version SET version_num='c1234567890' WHERE alembic_version.version_num = 'b1573a5e9618';

-- Running upgrade c1234567890 -> e4f5a6b7c8d9

CREATE TABLE ev_opportunity_history (
    id INTEGER NOT NULL, 
    opp_hash VARCHAR(64) NOT NULL, 
    sport VARCHAR(10) NOT NULL, 
    player VARCHAR(100) NOT NULL, 
    market VARCHAR(50) NOT NULL, 
    ev_percent FLOAT NOT NULL, 
    ev_tier VARCHAR(20) NOT NULL, 
    detected_at DATETIME NOT NULL, 
    line FLOAT, 
    odds INTEGER, 
    confidence FLOAT, 
    bookmaker VARCHAR(50), 
    team VARCHAR(50), 
    opponent VARCHAR(50), 
    PRIMARY KEY (id)
);

CREATE INDEX idx_ev_hist_sport_date ON ev_opportunity_history (sport, detected_at);

CREATE INDEX idx_ev_hist_tier_date ON ev_opportunity_history (ev_tier, detected_at);

CREATE INDEX idx_ev_hist_player_date ON ev_opportunity_history (player, detected_at);

CREATE INDEX idx_ev_hist_ev_pct ON ev_opportunity_history (ev_percent);

CREATE INDEX ix_ev_opportunity_history_opp_hash ON ev_opportunity_history (opp_hash);

CREATE INDEX ix_ev_opportunity_history_sport ON ev_opportunity_history (sport);

CREATE INDEX ix_ev_opportunity_history_player ON ev_opportunity_history (player);

CREATE INDEX ix_ev_opportunity_history_market ON ev_opportunity_history (market);

CREATE INDEX ix_ev_opportunity_history_ev_percent ON ev_opportunity_history (ev_percent);

CREATE INDEX ix_ev_opportunity_history_ev_tier ON ev_opportunity_history (ev_tier);

CREATE INDEX ix_ev_opportunity_history_detected_at ON ev_opportunity_history (detected_at);

CREATE TABLE arbitrage_history (
    id INTEGER NOT NULL, 
    arb_hash VARCHAR(64) NOT NULL, 
    sport VARCHAR(10) NOT NULL, 
    market VARCHAR(50) NOT NULL, 
    profit_pct FLOAT NOT NULL, 
    books_json TEXT NOT NULL, 
    detected_at DATETIME NOT NULL, 
    player VARCHAR(100), 
    line FLOAT, 
    total_stake_required FLOAT, 
    num_bookmakers INTEGER NOT NULL, 
    team VARCHAR(50), 
    opponent VARCHAR(50), 
    PRIMARY KEY (id)
);

CREATE INDEX idx_arb_hist_sport_date ON arbitrage_history (sport, detected_at);

CREATE INDEX idx_arb_hist_profit_date ON arbitrage_history (profit_pct, detected_at);

CREATE INDEX idx_arb_hist_player_date ON arbitrage_history (player, detected_at);

CREATE INDEX idx_arb_hist_profit_pct ON arbitrage_history (profit_pct);

CREATE INDEX ix_arbitrage_history_arb_hash ON arbitrage_history (arb_hash);

CREATE INDEX ix_arbitrage_history_sport ON arbitrage_history (sport);

CREATE INDEX ix_arbitrage_history_market ON arbitrage_history (market);

CREATE INDEX ix_arbitrage_history_profit_pct ON arbitrage_history (profit_pct);

CREATE INDEX ix_arbitrage_history_detected_at ON arbitrage_history (detected_at);

CREATE INDEX ix_arbitrage_history_player ON arbitrage_history (player);

UPDATE alembic_version SET version_num='e4f5a6b7c8d9' WHERE alembic_version.version_num = 'c1234567890';

