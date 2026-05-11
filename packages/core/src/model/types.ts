/** file 0=a … 7=h; rank 0=8th rank (top) … rank 7=1st rank (bottom, White's back rank). */
export type Square = { file: number; rank: number };

export type Side = "white" | "black";

export type PieceKind =
  | "pawn"
  | "knight"
  | "bishop"
  | "rook"
  | "queen"
  | "king";

export type Piece = {
  kind: PieceKind;
  side: Side;
};

/** Occupancy map: key "file,rank". */
export type BoardState = Map<string, Piece>;

export type Move = {
  from: Square;
  to: Square;
  /** Required when a pawn reaches the last rank. */
  promotion?: PieceKind;
};

export type CastlingRights = {
  whiteKingSide: boolean;
  whiteQueenSide: boolean;
  blackKingSide: boolean;
  blackQueenSide: boolean;
};

/** Standard chess auxiliary state (FEN-like). */
export type ChessMeta = {
  castling: CastlingRights;
  /** Pawn-capture destination square valid only this turn; FEN ep target square. */
  enPassantTarget: Square | null;
  halfmoveClock: number;
  fullmoveNumber: number;
};

export type GameSnapshot = {
  board: BoardState;
  sideToMove: Side;
  meta: ChessMeta;
};

export type GameStatus =
  | { kind: "playing"; inCheck: boolean }
  | { kind: "checkmate"; winner: Side }
  | { kind: "stalemate" }
  | { kind: "draw"; reason: "fifty-move" | "insufficient-material" };
