import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Scrollbar, A11y } from 'swiper/modules'; // Import the necessary modules
import 'swiper/css';
import 'swiper/css/navigation'; // Import navigation styles
import 'swiper/css/pagination';
import 'swiper/css/scrollbar';

// Swiper Carousel Component
const SwipeCarousel = ({ items, renderItem }) => {
  return (
    <Swiper
      modules={[Navigation, Pagination, Scrollbar, A11y]} // Include the necessary modules
      spaceBetween={10}
      slidesPerView={3}
      navigation
      pagination={{ clickable: true }}
      scrollbar={{ draggable: true }}
    >
      {items.map((item, index) => (
        <SwiperSlide key={index}>{renderItem(item)}</SwiperSlide>
      ))}
    </Swiper>
  );
};

export default SwipeCarousel;
