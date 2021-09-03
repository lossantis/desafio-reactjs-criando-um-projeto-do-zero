import { GetStaticPaths, GetStaticProps } from 'next';

import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

import Prismic from '@prismicio/client';

import { useRouter } from 'next/router'
import { RichText } from 'prismic-dom';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }) {
  const router = useRouter()

  if (router.isFallback) {
    return <div>Carregando...</div>
  }

  const totalWords = post.data.content.reduce((total, contentItem) => {
    total += contentItem.heading.split(' ').length;

    const words = contentItem.body.map(item => item.text.split(' ').length);
    words.map(word => (total += word));
    return total;
  }, 0);
  const readTime = Math.ceil(totalWords / 200);


  const date = new Date(post.first_publication_date);

  const first_publication_date = 
    date.toLocaleDateString('pt-BR', { day: 'numeric'} ) + ' ' +
    date.toLocaleDateString('pt-BR', { month: 'short'} ).replace('.', '') + ' ' +
    date.toLocaleDateString('pt-BR', { year: 'numeric'} )
  ; 

  return (
    <div className={styles.content}>
      <img src={post.data.banner.url} alt={post.data.title} height="400"/>
      <h2>{ post.data.title }</h2>
      <div>
        <p>
          { first_publication_date }
        </p>
        <p>
          { post.data.author }
        </p>
        <p>
        {`${readTime} min`}
        </p>

        {post.data.content.map(content => {
            return (
              <article key={content.heading}>
                <h2>{content.heading}</h2>
                <div
                    dangerouslySetInnerHTML={{
                    __html: RichText.asHtml(content.body),
                  }}
                />
              </article>
            );
          })}
      </div>
    </div>
  )
}

export const getStaticPaths = async () => {
  const prismic = getPrismicClient();
  
  
  const response = await prismic.query(
    [
        Prismic.predicates.at('document.type', 'post')
    ],
    {
        pageSize: 12,
    }
  )

  const paths = response.results.map(post => {
    return { params: { slug: post.uid } };
  })

  return {
    paths,
    fallback: true
  }
};

export const getStaticProps = async context => {
  const { params } = context; 

  const prismic = getPrismicClient();

  const response = await prismic.getByUID('post', String(params.slug), {});

  let content = "";

  content =  response.data.content.map(content => {
    return {
      heading: content.heading,
      body: [...content.body],
    };
  })

  const post = {
    first_publication_date: response.first_publication_date,
    uid: response.uid,
    data: {
      author: response.data.author,
      banner: response.data.banner,
      content,
      subtitle: response.data.subtitle,
      title: response.data.title,
    },
  }

  return {
    props: {
        post
    },
    redirect: 60 * 30, //30 minutes 
  }
};
