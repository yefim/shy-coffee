import { useEffect, useRef, useState } from 'react'
import './App.css'


import { createClient } from '@supabase/supabase-js'
import * as Dialog from '@radix-ui/react-dialog';
import { sample } from 'lodash';

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
  const [notes, setNotes] = useState<string>('');
  const [open, setOpen] = useState<boolean>(false);
  const [status, setStatus] = useState<'idle' | 'pending'>('idle');
  const placeholder = useRef<string>(getPlaceholder());

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
    if (!name.trim() || !address.trim()) return;

    setStatus('pending');

    console.log('Adding cafe...');
    const cafe: Omit<Cafe, 'id' | 'created_at'> = {
      name: name.trim(),
      address: address.trim(),
      notes: notes.trim() || null,
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
      setTimeout(() => {
        setCafes((prevCafes) => prevCafes === 'loading' ? [newCafe] : [newCafe, ...prevCafes]);
        setOpen(false);
        setName('');
        setAddress('');
        setStatus('idle');
      }, 400);
    }
  }

  return (
    <>
      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Trigger asChild>
          <button className="add-a-spot-btn" type="button">Add a spot</button>
        </Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Overlay className="DialogOverlay" />
          <Dialog.Content className="DialogContent">
            <form autoComplete="off" className="add-a-spot" method="post" onSubmit={handleSubmit}>
              <label>Name
                <input type="text" autoComplete="off" placeholder="Coffee Deluxe" value={name} onChange={(e) => setName(e.target.value)} />
              </label>
              <label>Address
                <input type="text" autoComplete="off" placeholder="123 Bean St" value={address} onChange={(e) => setAddress(e.target.value)} />
              </label>
              <label>Notes
                <textarea rows={3} autoComplete="off" placeholder={placeholder.current || ''} onChange={(e) => setNotes(e.target.value)}>{notes}</textarea>
              </label>
              <button disabled={status === 'pending'} type="submit">{status === 'idle' ? 'Add' : 'Adding...'}</button>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
      {
        cafes !== 'loading' && cafes.length > 0 && (
          cafes.map((cafe, i) => <Cafe key={i} cafe={cafe} />)
        )
      }
    </>
  )
}

function getPlaceholder(): string {
  return sample([
    'The coffee here really took my breath away...',
    'Immaculate vibes all around...',
    'Loved every second...',
    '☕️❤️...',
    'Divine pastries, need I say otherwise??'
  ]);
}

function Cafe({ cafe }: { cafe: Cafe }) {
  return (
    <div className="cafe">
      <h2>{cafe.name}</h2>
      {cafe.notes && <p>{cafe.notes}</p>}
      <a target="_blank" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cafe.address)}`}>{cafe.address}</a>
    </div>
  );
}

export default App
