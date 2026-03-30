import React, { useMemo, useState } from 'react';
import { createHuarongdaoService } from '../../../server';
import type { CreateHuarongdaoConfigInput } from '../../../types';

const HuarongdaoConfigPage: React.FC = () => {
  const service = useMemo(() => createHuarongdaoService(), []);
  const [version, setVersion] = useState(0);
  const [name, setName] = useState('示例华容道');
  const [slug, setSlug] = useState('sample-huarongdao');
  const [imageUrl, setImageUrl] = useState('https://i.imgur.com/6z7Qw6M.png');
  const [rows, setRows] = useState(3);
  const [cols, setCols] = useState(3);

  const list = useMemo(() => {
    void version;
    return service.listConfigs();
  }, [service, version]);

  const create = () => {
    const input: CreateHuarongdaoConfigInput = {
      name,
      slug,
      sourceImageUrl: imageUrl,
      rows,
      cols,
      showReference: true,
      shuffleSteps: 80,
    };
    service.createConfig(input);
    setVersion((v) => v + 1);
  };

  return (
    <section>
      <h2>华容道后台配置页</h2>
      <p>支持多套配置创建、参数化管理（V1 骨架）</p>
      <div>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="name" />
        <input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="slug" />
        <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="image url" />
        <input type="number" value={rows} onChange={(e) => setRows(Number(e.target.value) || 3)} />
        <input type="number" value={cols} onChange={(e) => setCols(Number(e.target.value) || 3)} />
        <button onClick={create}>创建配置</button>
      </div>
      <ul>
        {list.map((item) => (
          <li key={item.id}>{item.name} ({item.slug}) - {item.rows}x{item.cols} - {item.status}</li>
        ))}
      </ul>
    </section>
  );
};

export default HuarongdaoConfigPage;
