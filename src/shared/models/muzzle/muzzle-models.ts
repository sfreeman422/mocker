export interface IMuzzled {
  suppressionCount: number;
  muzzledBy: string;
}

export interface IMuzzler {
  muzzleCount: number;
  muzzleCountRemover?: number;
}
