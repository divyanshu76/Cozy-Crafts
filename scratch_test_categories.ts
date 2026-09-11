import { createClient } from '@supabase/supabase-js';
import { loadEnvConfig } from '@next/env';

const projectDir = process.cwd();
loadEnvConfig(projectDir);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
);

async function test() {
  const { data: cats, error: err1 } = await supabase.from('categories').select('*');
  console.log('Categories:', cats, err1);

  const { data: prods, error: err2 } = await supabase.from('products').select('id, name, slug, category_id, categories(slug)').eq('slug', 'fluffy-football-keychain');
  console.log('Product test:', prods, err2);
  
  const { data: catProds, error: err3 } = await supabase.from('products').select('id, name, slug, category_id, categories(slug)').eq('categories.slug', 'keychains');
  console.log('Products by category query:', catProds, err3);
}

test();
