import { GetStaticProps } from 'next';

import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

import Prismic from '@prismicio/client';

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

export default function Home(props: PostPagination) {
  return (
    <>
    Home
    </>
  )
}

export const getStaticProps = async () => {
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
        pageSize: 100,
    }
  )

  const results = response.results.map(post => {
      return {
          uid: post.uid,
          first_publication_date: new Date(post.first_publication_date).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
          }),
          data: {
            title: post.data.title,
            subtitle: post.data.subtitle,
            author: post.data.author,
          },
      }
  })

  return {
    props: {
      results,
      next_page: ''
    }
  }
};