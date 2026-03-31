-- SÉRAINE シードデータ

-- カテゴリ
insert into public.categories (name, slug, sort_order) values
  ('美容液', 'serum', 1),
  ('クリーム', 'cream', 2),
  ('化粧水', 'toner', 3),
  ('クレンジング', 'cleansing', 4),
  ('アイケア', 'eyecare', 5),
  ('日焼け止め', 'sunscreen', 6),
  ('マスク', 'mask', 7),
  ('セット', 'set', 8);

-- 商品
insert into public.products (name, price, description, ingredients, image_urls, stock, category_id, is_active) values
  ('リュミエール セラム', 12800, 'ビタミンC誘導体配合。透明感あふれる肌へ導く美容液。朝晩の洗顔後、化粧水の前にお使いください。', 'ビタミンC誘導体、ヒアルロン酸Na、セラミドNP、アルブチン、トラネキサム酸', array['/images/product-serum.jpg'], 50, (select id from public.categories where slug = 'serum'), true),
  ('ヴェルール クリーム', 9800, 'シアバター×ヒアルロン酸。ベルベットのような仕上がりのリッチクリーム。', 'シアバター、ヒアルロン酸Na、スクワラン、コラーゲン、ビタミンE', array['/images/product-cream.jpg'], 40, (select id from public.categories where slug = 'cream'), true),
  ('ロゼ トーナー', 6800, 'ダマスクローズウォーター配合。うるおいの土台を整える化粧水。', 'ダマスクバラ花水、グリセリン、BG、ヒアルロン酸Na、セラミドAP', array['/images/product-toner.jpg'], 60, (select id from public.categories where slug = 'toner'), true),
  ('ペタル クレンジング', 5400, '花びら由来オイルで優しくメイクオフ。肌に負担をかけないクレンジングオイル。', 'ホホバ種子油、オリーブ果実油、ラベンダー油、ローズヒップ油', array['/images/product-cleansing.png'], 45, (select id from public.categories where slug = 'cleansing'), true),
  ('エクロール アイクリーム', 8500, 'レチノール配合。目元にハリと輝きを与えるアイクリーム。', 'レチノール、ペプチド、カフェイン、ビタミンK、シアバター', array['/images/product-eyecream.png'], 35, (select id from public.categories where slug = 'eyecare'), true),
  ('シエル UV プロテクト', 4800, 'SPF50+ PA++++。白浮きしない軽やかなつけ心地の日焼け止め。', '酸化チタン、酸化亜鉛、ヒアルロン酸Na、ビタミンC誘導体', array['/images/product-sunscreen.png'], 70, (select id from public.categories where slug = 'sunscreen'), true),
  ('ノクテイユ ナイトマスク', 7200, '眠っている間に集中ケア。翌朝のツヤが違うスリーピングマスク。', 'レチノール、ナイアシンアミド、セラミドNP、アデノシン', array['/images/product-nightmask.png'], 30, (select id from public.categories where slug = 'mask'), true),
  ('セレーヌ コフレセット', 28000, '人気4品のスペシャルセット。限定パッケージでお届けします。', 'セラム・クリーム・トーナー・クレンジングの4品セット', array['/images/product-coffret.png'], 20, (select id from public.categories where slug = 'set'), true);

-- サイト設定
insert into public.site_settings (key, value) values
  ('shipping', '{"fee": 550, "free_threshold": 8000}'::jsonb),
  ('notification', '{"order_confirmed": true, "order_shipped": true, "order_cancelled": true}'::jsonb);
