import React, { useEffect, useState } from 'react';
import { IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonIcon, IonSearchbar } from '@ionic/react';
import { supabase } from '../utils/supabaseClients';
import { bookOutline } from 'ionicons/icons';

interface Post {
  post_id: string;
  username: string;
  post_title: string;
  post_content: string;
  post_created_at: string;
}

const SearchContainer: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);   // State to store posts
  const [searchText, setSearchText] = useState<string>('');   // State for search text

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const { data, error } = await supabase
          .from('posts')
          .select('*')  // Selecting all fields from the posts table
          .order('post_created_at', { ascending: false });  // Order by creation time in descending order

        if (error) {
          console.error('Error fetching posts:', error);
        } else {
          setPosts(data as Post[]);  // If no error, set the fetched posts
        }
      } catch (err) {
        console.error('Error fetching posts:', err);  // Catch any errors during fetch
      }
    };

    fetchPosts();  // Fetch posts when the component mounts
  }, []);  // Empty dependency array means this will only run once when the component mounts

  const filteredPosts = posts.filter((post) =>
    post.post_title.toLowerCase().includes(searchText.toLowerCase())  // Filter posts by title based on the search text
  );

  return (
    <>
      {/* Search Bar for filtering posts by title */}
      <IonSearchbar
        value={searchText}
        onIonInput={(e) => setSearchText(e.detail.value!)}
        placeholder="Search by book title"
      />

      {/* If there are filtered posts, map and display them as cards */}
      {filteredPosts.length > 0 ? (
        filteredPosts.map((post) => (
          <IonCard key={post.post_id} button>
            <IonCardHeader>
              <IonIcon icon={bookOutline} size="large" color="primary" />
              <IonCardTitle>{post.post_title}</IonCardTitle>
              <IonCardSubtitle>{post.username}</IonCardSubtitle>
            </IonCardHeader>
          </IonCard>
        ))
      ) : (
        <div>No posts found.</div>
      )}
    </>
  );
};

export default SearchContainer;
