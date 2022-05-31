import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Prismic from '@prismicio/client';

import { FaClock, FaRegCalendarAlt, FaUserAlt } from 'react-icons/fa';
import { RichText } from 'prismic-dom';
import { useRouter } from 'next/router';
import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

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

export default function Post({ post }: PostProps): JSX.Element {
  const router = useRouter();
  if (router.isFallback) {
    return <h1>Carregando...</h1>;
  }

  const totalWords = post.data.content.reduce((total, contentItem) => {
    total += contentItem.heading.split(' ').length;
    const words = contentItem.body.map(item => item.text.split(' ').length);
    words.map(word => (total += word));
    return total;
  }, 0);
  const readTime = Math.ceil(totalWords / 200);

  return (
    <>
      <Head>
        <title>{post.data.title} | Charter III</title>
      </Head>
      <div className={styles.banner}>
        <img src={post.data.banner.url} alt={post.data.title} />
      </div>
      <main className={commonStyles.contentContainer}>
        <section className={commonStyles.postContainer}>
          <h1>{post.data.title}</h1>
          <section>
            <div>
              <FaRegCalendarAlt />
              <time>
                {format(new Date(post.first_publication_date), 'dd MMM yyyy', {
                  locale: ptBR,
                })}
              </time>
            </div>
            <div>
              <FaUserAlt /> {post.data.author}
            </div>
            <div>
              <FaClock /> {readTime} min
            </div>
          </section>
          {post.data.content.map(content => (
            <article key={content.heading} className={styles.content}>
              <h3>{content.heading}</h3>
              <main
                className={styles.postContent}
                dangerouslySetInnerHTML={{
                  __html: RichText.asHtml(content.body),
                }}
              />
            </article>
          ))}
        </section>
      </main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query([
    Prismic.Predicates.at('document.type', 'posts'),
  ]);

  const paths = posts.results.map(post => {
    return {
      params: {
        slug: post.uid,
      },
    };
  });

  return {
    paths,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async context => {
  const prismic = getPrismicClient();
  const { slug } = context.params;
  const response = await prismic.getByUID('post', String(slug), {});

  const post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      author: response.data.author,
      banner: {
        url: response.data.banner.url,
      },
      content: response.data.content.map(content => {
        return {
          heading: content.heading,
          body: [...content.body],
        };
      }),
    },
  };

  console.log(JSON.stringify(post, null, 2));

  return {
    props: {
      post,
    },
    revalidate: 1800,
  };
};
