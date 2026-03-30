import React from 'react';

export interface HuarongdaoBoardProps {
  tiles: number[];
  rows: number;
  cols: number;
  imageUrl: string;
  onClickTile: (index: number) => void;
}

const HuarongdaoBoard: React.FC<HuarongdaoBoardProps> = ({ tiles, rows, cols, imageUrl, onClickTile }) => {
  const total = rows * cols;
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, 96px)`,
        gridTemplateRows: `repeat(${rows}, 96px)`,
        gap: 6,
      }}
    >
      {tiles.map((tile, index) => {
        if (tile === 0) return <div key={`blank-${index}`} style={{ background: '#ddd' }} />;
        const pieceIndex = tile - 1;
        const pr = Math.floor(pieceIndex / cols);
        const pc = pieceIndex % cols;
        return (
          <button
            key={`${tile}-${index}`}
            onClick={() => onClickTile(index)}
            style={{
              border: '1px solid #666',
              cursor: 'pointer',
              backgroundImage: `url(${imageUrl})`,
              backgroundSize: `${cols * 96}px ${rows * 96}px`,
              backgroundPosition: `${-pc * 96}px ${-pr * 96}px`,
            }}
          />
        );
      })}
      {tiles.length !== total ? <div>tiles invalid</div> : null}
    </div>
  );
};

export default HuarongdaoBoard;
