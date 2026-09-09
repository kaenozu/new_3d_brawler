export type HurtboxOwner = "player" | "enemy";

export type Hurtbox = {
  owner: HurtboxOwner;
  radius: number;
  height: number;
};

export const PLAYER_HURTBOX: Hurtbox = {
  owner: "player",
  radius: 0.32,
  height: 1.55,
};

export const ENEMY_HURTBOX: Hurtbox = {
  owner: "enemy",
  radius: 0.45,
  height: 1.6,
};

export const BLOB_HURTBOX: Hurtbox = {
  owner: "enemy",
  radius: 0.55,
  height: 1.0,
};

export const GOLEM_HURTBOX: Hurtbox = {
  owner: "enemy",
  radius: 0.5,
  height: 1.8,
};
