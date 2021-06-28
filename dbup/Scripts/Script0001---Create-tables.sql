CREATE TABLE IF NOT EXISTS player (
    player_id uuid PRIMARY KEY,
    username varchar(255),
    salt varchar(16),
    password varchar,
    created_at timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS game (
    game_id uuid PRIMARY KEY,
    player_id uuid,
    complete bool DEFAULT false,
    properties json DEFAULT '{}'::JSON,
    created_at timestamp DEFAULT now(),

    CONSTRAINT fk_player
        FOREIGN KEY (player_id)
            REFERENCES player(player_id)
);

CREATE TABLE IF NOT EXISTS  move (
    move_id uuid PRIMARY KEY,
    game_id uuid,
    player_id uuid,
    num int,
    position_x int,
    position_y int,
    created_at timestamp DEFAULT now(),

    CONSTRAINT fk_game
        FOREIGN KEY (game_id)
            REFERENCES game(game_id),
    CONSTRAINT fk_player
        FOREIGN KEY (player_id)
            REFERENCES player(player_id)
)