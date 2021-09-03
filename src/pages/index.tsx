import { GetStaticProps } from 'next';

import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

import Prismic from '@prismicio/client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import router from "next/router";

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps) {
  const { results, next_page } = postsPagination;
  
  const [ nextPage, setNextPage ] = useState(next_page);
  const [ currentPage, setCurrentPage ] = useState(1)

  const newPosts = results.map(post => {
    const date = new Date(post.first_publication_date);

    const first_publication_date = `
      ${date.toLocaleDateString('pt-BR', { day: 'numeric'} )}
      ${date.toLocaleDateString('pt-BR', { month: 'short'} ).replace('.', '')}
      ${date.toLocaleDateString('pt-BR', { year: 'numeric'} )}
    `;

    return {
      uid: post.uid,
      first_publication_date,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
    };
  });

  const [ posts, setPosts ] = useState<Post[]>(newPosts);

  async function loadMorePosts() {
    if (currentPage !== 1 && nextPage === null) {
      return;
    }

    const response = await fetch(`${nextPage}`).then(response =>
      response.json()
    );

    setNextPage(response.next_page);
    setCurrentPage(response.page);

    const newPosts = response.results.map(post => {
      const date = new Date(post.first_publication_date);

      const first_publication_date = `
        ${date.toLocaleDateString('pt-BR', { day: 'numeric'} )}
        ${date.toLocaleDateString('pt-BR', { month: 'short'} ).replace('.', '')}
        ${date.toLocaleDateString('pt-BR', { year: 'numeric'} )}
      `;

      return {
        uid: post.uid,
        first_publication_date,
        data: {
          title: post.data.title,
          subtitle: post.data.subtitle,
          author: post.data.author,
        },
      };
    });

    setPosts([...posts, ...newPosts]);
  }
  
  if (!results) {
    return <></>
  }

  return (
    <div className={styles.posts}>
      { posts.map(post => (
        <article key={post.uid}>
          <h2>
            <Link href={`/post/${post.uid}`}>
              {post.data.title}
            </Link>
          </h2>
          <h3>{post.data.subtitle}</h3>
          <section className={styles.dateAuthorWrap}>
            <time>{post.first_publication_date}</time>
            <span className={styles.author}>{post.data.author}</span>
          </section>
        </article>
      ))}

      { nextPage != null &&
        <button className={styles.loadMorePosts}
                style={{display: nextPage ? 'block' : 'none' }}
                onClick={() => loadMorePosts()}
        >
          Carregar mais posts
        </button>
      }
      
    </div>
  )
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();

  const response = await prismic.query(
    [
        Prismic.predicates.at('document.type', 'post')
    ],
    {
        fetch: [
            'post.title',
            'post.subtitle',
            'post.author',
        ],
        pageSize: 1,
    }
  )

  const posts = response.results.map(post => {
    return {
        uid: post.uid,
        first_publication_date: post.first_publication_date,
        data: {
          title: post.data.title,
          subtitle: post.data.subtitle,
          author: post.data.author,
        },
    }
  })

  const postsPagination = {
    next_page: response.next_page,
    results: posts,
  };

  return {
    props: {
      postsPagination
    }
  }
};