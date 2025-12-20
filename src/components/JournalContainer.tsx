import { useState, useEffect } from 'react';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonButton, IonInput,
  IonLabel, IonModal, IonFooter, IonCard, IonCardContent, IonCardHeader,
  IonCardSubtitle, IonCardTitle, IonAlert, IonIcon, IonGrid, IonRow, IonCol
} from '@ionic/react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../utils/supabaseClients';
import { bookOutline, closeCircleOutline, pencil, trash } from 'ionicons/icons';

interface JournalEntry {
  post_id: string;
  auth_uid: string;
  username: string;
  avatar_url: string;
  post_title: string;         // <-- added
  post_content: string;
  post_created_at: string;
  post_updated_at: string;
}

const JournalContainer = () => {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [entryTitle, setEntryTitle] = useState('');     // <-- added
  const [entryContent, setEntryContent] = useState('');
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [isDiaryModalOpen, setIsDiaryModalOpen] = useState(false);

  useEffect(() => {
    const fetchUserAndEntries = async () => {
      const { data: authData } = await supabase.auth.getUser();
      if (authData?.user?.email?.endsWith('@nbsc.edu.ph')) {
        setUser(authData.user);
        const { data: userData } = await supabase
          .from('users')
          .select('username, user_avatar_url')
          .eq('user_email', authData.user.email)
          .single();

        if (userData) {
          setUsername(userData.username);
          fetchEntries(authData.user.id);
        }
      }
    };

    const fetchEntries = async (authUid: string) => {
      const { data } = await supabase
        .from('posts')
        .select('*')
        .eq('auth_uid', authUid)
        .order('post_created_at', { ascending: false });

      if (data) setEntries(data as JournalEntry[]);
    };

    fetchUserAndEntries();
  }, []);

  const createEntry = async () => {
    if (!entryTitle || !entryContent || !user || !username) return;

    const { data: userData } = await supabase
      .from('users')
      .select('user_avatar_url')
      .eq('user_email', user.email)
      .single();

    const avatarUrl = userData?.user_avatar_url || 'https://ionicframework.com/docs/img/demos/avatar.svg';

    const { data } = await supabase
      .from('posts')
      .insert([{
        post_title: entryTitle,       // <-- include title
        post_content: entryContent,
        auth_uid: user.id,
        username,
        avatar_url: avatarUrl,
      }])
      .select('*');

    if (data) {
      setEntries([data[0] as JournalEntry, ...entries]);
      setEntryTitle('');   // <-- reset title
      setEntryContent('');
    }
  };

  const openDiary = (entry: JournalEntry) => {
    setSelectedEntry(entry);
    setEntryTitle(entry.post_title);      // <-- set title
    setEntryContent(entry.post_content);
    setIsDiaryModalOpen(true);
  };

  const saveEditedEntry = async () => {
    if (!entryTitle || !entryContent || !selectedEntry) return;

    const { data } = await supabase
      .from('posts')
      .update({
        post_title: entryTitle,           // <-- update title
        post_content: entryContent,
      })
      .match({ post_id: selectedEntry.post_id })
      .select('*');

    if (data) {
      const updatedEntry = data[0] as JournalEntry;
      setEntries(entries.map(entry => entry.post_id === updatedEntry.post_id ? updatedEntry : entry));
      setSelectedEntry(null);
      setEntryTitle('');
      setEntryContent('');
      setIsDiaryModalOpen(false);
      setIsAlertOpen(true);
    }
  };

  const deleteEntry = async () => {
    if (!selectedEntry) return;
    await supabase.from('posts').delete().match({ post_id: selectedEntry.post_id });
    setEntries(entries.filter(entry => entry.post_id !== selectedEntry.post_id));
    setSelectedEntry(null);
    setIsDiaryModalOpen(false);
  };

  return (
    <>
      <IonContent>
        {user ? (
          <>
            <IonCard>
              <IonCardHeader>
                <IonCardTitle color="danger">New Journal Entry</IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <IonInput
                  value={entryTitle}
                  placeholder="Enter book title"
                  onIonChange={e => setEntryTitle(e.detail.value!)}
                />
                <IonInput
                  value={entryContent}
                  placeholder="Write your thoughts..."
                  onIonChange={e => setEntryContent(e.detail.value!)}
                />
              </IonCardContent>
              <div style={{ textAlign: 'right', padding: '0.5rem' }}>
                <IonButton onClick={createEntry} color="danger">Save as Book</IonButton>
              </div>
            </IonCard>

            <IonGrid>
              <IonRow>
                {entries.map(entry => (
                  <IonCol size="6" key={entry.post_id}>
                    <IonCard button onClick={() => openDiary(entry)} style={{ textAlign: 'center', cursor: 'pointer' }}>
                      <IonCardHeader>
                        <IonIcon icon={bookOutline} size="large" color="primary" />
                        <IonCardTitle style={{ marginTop: '10px' }}>{entry.post_title || 'Untitled Book'}</IonCardTitle>
                        <IonCardSubtitle>{new Date(entry.post_created_at).toLocaleDateString()}</IonCardSubtitle>
                      </IonCardHeader>
                    </IonCard>
                  </IonCol>
                ))}
              </IonRow>
            </IonGrid>
          </>
        ) : (
          <IonLabel>Loading...</IonLabel>
        )}
      </IonContent>

      {/* Diary Modal */}
      <IonModal isOpen={isDiaryModalOpen} onDidDismiss={() => setIsDiaryModalOpen(false)}>
        <IonHeader>
          <IonToolbar>
            <IonTitle>My Diary</IonTitle>
            <IonButton slot="end" fill="clear" onClick={() => setIsDiaryModalOpen(false)}>
              <IonIcon icon={closeCircleOutline} />
            </IonButton>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>{selectedEntry?.username}</IonCardTitle>
              <IonCardSubtitle>{selectedEntry && new Date(selectedEntry.post_created_at).toLocaleString()}</IonCardSubtitle>
            </IonCardHeader>
            <IonCardContent>
              <IonInput
                value={entryTitle}
                onIonChange={e => setEntryTitle(e.detail.value!)}
                placeholder="Edit title..."
              />
              <IonInput
                value={entryContent}
                onIonChange={e => setEntryContent(e.detail.value!)}
                placeholder="Edit your diary..."
              />
            </IonCardContent>
          </IonCard>
        </IonContent>
        <IonFooter>
          <IonButton expand="block" color="primary" onClick={saveEditedEntry}>
            <IonIcon icon={pencil} slot="start" />
            Save
          </IonButton>
          <IonButton expand="block" color="danger" onClick={deleteEntry}>
            <IonIcon icon={trash} slot="start" />
            Delete
          </IonButton>
        </IonFooter>
      </IonModal>

      <IonAlert
        isOpen={isAlertOpen}
        onDidDismiss={() => setIsAlertOpen(false)}
        header="Success"
        message="Your diary entry was updated."
        buttons={['OK']}
      />
    </>
  );
};

export default JournalContainer;
