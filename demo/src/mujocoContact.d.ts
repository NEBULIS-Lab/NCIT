interface DisposableMujocoContact {
  geom1: number;
  geom2: number;
  dist: number;
  delete?: () => void;
}

interface DisposableMujocoContactVector {
  get(index: number): DisposableMujocoContact | undefined;
  delete?: () => void;
}

export function isPassiveRetainingContactGeom(name: string): boolean;

export function consumeMujocoContact(
  getContactAt: (index: number) => DisposableMujocoContact | undefined,
  index: number,
): { geom1: number; geom2: number; distance: number } | null;

export function consumeMujocoContacts(
  contactVector: DisposableMujocoContactVector,
  count: number,
): Array<{ geom1: number; geom2: number; distance: number }>;
