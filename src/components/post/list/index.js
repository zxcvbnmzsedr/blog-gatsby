import React from 'react';
import {Link} from 'gatsby';
import Tags from '../../tags';
import {Card, Col, Row} from "antd";
import './index.less'

const PostList = ({posts}) => {
    const PostList = posts.map(({frontmatter, field, excerpt, timeToRead}) => {
        const {title, tags, date, description} = frontmatter;
        const {slug} = field;
        return (
            <Col span={6}
                 lg={8}
                 md={12}
                 xs={24}>
                <PostListItem
                    key={slug}
                    tags={tags}
                    title={title}
                    date={date}
                    slug={slug}
                    timeToRead={timeToRead}
                    description={description}
                    excerpt={excerpt}
                />
            </Col>
        );
    });

    return <div className="list">
        <Row gutter={16}>
            {PostList}
        </Row>

    </div>;
};

export default PostList;

const PostListItem = ({
                          title,
                          date,
                          timeToRead,
                          tags,
                          excerpt,
                          description,
                          slug,
                      }) => {
    return (

        <Card hoverable
              title={<>
                  <Tags tags={tags}/>
                  <span className="title">
                      <Link to={slug}>{title}
                      </Link>
                  </span>
              </>
              } className="card">
            <p
                dangerouslySetInnerHTML={{
                    __html: description || excerpt,
                }}
            />
            <div className="meta">
                <span>{date}</span>
                <span>阅读需要 {timeToRead} 分钟</span>
            </div>
        </Card>
    );
};
