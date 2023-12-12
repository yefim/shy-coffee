import { useEffect, useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'


import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://nlmvouryycplqrhwjnxe.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5sbXZvdXJ5eWNwbHFyaHdqbnhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDIzNTU4MDcsImV4cCI6MjAxNzkzMTgwN30.DNwk34GuKgDUicfJ3pjYsP_abyaFbscPWU37eARvj4U';
const supabase = createClient(supabaseUrl, supabaseKey)

interface Cafe {
  id: number;
  name: string;
  address: string;
  notes: string | null;
}

function App() {
  const [cafes, setCafes] = useState<Cafe[] | 'loading'>('loading');
  const [name, setName] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [status, setStatus] = useState<'idle' | 'pending'>('idle');

  useEffect(() => {
    async function loadCafes() {
      console.log('Fetching cafes...');

      const { data, error } = await supabase
        .from('Cafes')
        .select()
        .order('created_at', { ascending: false });
      if (error == null && !!data) {
        const newCafes = data.map((row) => ({
          id: row.id,
          name: row.name,
          address: row.address,
          notes: row.notes,
        }));
        console.log('Got cafes', newCafes);

        setCafes((prevCafes) =>
          prevCafes === 'loading' ? newCafes : [...prevCafes, ...newCafes]
        );
      }
    }
    loadCafes();
  }, []);

  console.log(JSON.stringify({ cafes }));

  async function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    setStatus('pending');

    console.log('Adding cafe...');
    const cafe: Pick<Cafe, 'name' | 'address'> = {
      name,
      address,
    };

    const { error, data } = await supabase
      .from('Cafes')
      .insert(cafe)
      .select();

    if (error == null && !!data) {
      const newCafe: Cafe = {
        id: data[0].id,
        name: data[0].name,
        address: data[0].address,
        notes: data[0].notes,
      };

      console.log(newCafe);
      setCafes((prevCafes) => prevCafes === 'loading' ? [newCafe] : [newCafe, ...prevCafes]);
      setName('');
      setAddress('');
      setStatus('idle');
    }
  }

  return (
    <>
      <form method="post" onSubmit={handleSubmit}>
        <label>Name
          <input type="text" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label>Address
          <input type="text" placeholder="Address" value={address} onChange={(e) => setAddress(e.target.value)} />
        </label>
        <button disabled={status === 'pending'} type="submit">{status === 'idle' ? 'Add' : 'Adding...'}</button>
      </form>
      {
        cafes !== 'loading' && cafes.length > 0 && (
          cafes.map((cafe, i) => <Cafe key={i} cafe={cafe} />)
        )
      }
    </>
  )
}

function Cafe({ cafe }: { cafe: Cafe }) {
  return (
    <div>
      <p>{cafe.name}</p>
      <a target="_blank" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cafe.address)}`}>{cafe.address}</a>
      {cafe.notes && <p>{cafe.notes}</p>}
    </div>
  );
}

export default App
