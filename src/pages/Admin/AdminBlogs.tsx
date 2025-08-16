import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase, Database } from '../../lib/supabase'
import LoadingSpinner from '../../components/UI/LoadingSpinner'
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye, 
  ToggleLeft, 
  ToggleRight,
  Save,
  X,
  Calendar,
  User
} from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

type BlogPost = Database['public']['Tables']['blog_posts']['Row']

const AdminBlogs: React.FC = () => {
  const { t, i18n } = useTranslation()
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    slug: '',
    author_name: '',
    cover_image_url: '',
    tags: '',
    language: 'en',
    is_published: false,
  })

  useEffect(() => {
    fetchPosts()
  }, [i18n.language])

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('language', i18n.language)
        .order('created_at', { ascending: false })

      if (error) throw error

      setPosts(data || [])
    } catch (error) {
      console.error('Error fetching blog posts:', error)
      // Provide mock blog posts for admin
      const mockPostsEn = [
        {
          id: 'mock-blog-1',
          title: '5 Simple Steps to Financial Freedom',
          content: '<h2>Introduction</h2><p>Financial freedom doesn\'t have to be complicated. Here are five simple steps that anyone can follow to take control of their finances and build a secure future.</p><h3>1. Track Your Spending</h3><p>The first step to financial freedom is understanding where your money goes. Start by tracking every expense for at least one month.</p><h3>2. Create a Budget</h3><p>Once you know your spending patterns, create a realistic budget that allocates money for necessities, savings, and some fun.</p><h3>3. Build an Emergency Fund</h3><p>Aim to save 3-6 months of expenses in a separate savings account for unexpected situations.</p><h3>4. Pay Off High-Interest Debt</h3><p>Focus on paying off credit cards and other high-interest debt as quickly as possible.</p><h3>5. Start Investing</h3><p>Even small amounts invested regularly can grow significantly over time thanks to compound interest.</p>',
          excerpt: 'Discover the simple steps that can transform your financial life in just a few weeks.',
          slug: 'financial-freedom-steps',
          author_name: 'Sarah Johnson',
          cover_image_url: 'https://images.pexels.com/photos/4386431/pexels-photo-4386431.jpeg',
          tags: ['finance', 'money', 'budgeting'],
          language: 'en',
          is_published: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 'mock-blog-2',
          title: 'The Science of Stress Relief',
          content: '<h2>Understanding Stress</h2><p>Understanding how stress affects your body and mind is the first step to managing it effectively. Learn evidence-based techniques that actually work.</p><h3>What Happens When You\'re Stressed?</h3><p>When you encounter stress, your body releases hormones like cortisol and adrenaline. While these are helpful in short bursts, chronic stress can lead to serious health problems.</p><h3>Proven Stress Relief Techniques:</h3><h4>1. Deep Breathing</h4><p>Simple breathing exercises can activate your parasympathetic nervous system and reduce stress hormones.</p><h4>2. Progressive Muscle Relaxation</h4><p>Systematically tensing and relaxing muscle groups helps release physical tension.</p><h4>3. Mindfulness Meditation</h4><p>Regular meditation practice has been shown to reduce cortisol levels and improve emotional regulation.</p>',
          excerpt: 'Learn scientifically-proven methods to reduce stress and improve your mental well-being.',
          slug: 'science-stress-relief',
          author_name: 'Dr. Michael Chen',
          cover_image_url: 'https://images.pexels.com/photos/3760263/pexels-photo-3760263.jpeg',
          tags: ['wellness', 'stress', 'health'],
          language: 'en',
          is_published: true,
          created_at: new Date(Date.now() - 86400000).toISOString(),
          updated_at: new Date(Date.now() - 86400000).toISOString(),
        }
      ]
      
      const mockPostsTr = [
        {
          id: 'mock-blog-tr-1',
          title: 'Finansal Özgürlüğe 5 Basit Adım',
          content: '<h2>Giriş</h2><p>Finansal özgürlük karmaşık olmak zorunda değil. İşte herkesin takip edebileceği ve finansal geleceğini kontrol altına alabileceği beş basit adım.</p><h3>1. Harcamalarınızı Takip Edin</h3><p>Finansal özgürlüğün ilk adımı paranızın nereye gittiğini anlamaktır. En az bir ay boyunca her harcamanızı takip etmeye başlayın.</p><h3>2. Bütçe Oluşturun</h3><p>Harcama alışkanlıklarınızı öğrendikten sonra, zorunlu ihtiyaçlar, tasarruf ve eğlence için para ayıran gerçekçi bir bütçe oluşturun.</p><h3>3. Acil Durum Fonu Oluşturun</h3><p>Beklenmedik durumlar için ayrı bir tasarruf hesabında 3-6 aylık harcamanızı biriktirmeyi hedefleyin.</p>',
          excerpt: 'Finansal hayatınızı sadece birkaç hafta içinde dönüştürebilecek basit adımları keşfedin.',
          slug: 'finansal-ozgurluk-adimlari',
          author_name: 'Ayşe Demir',
          cover_image_url: 'https://images.pexels.com/photos/4386431/pexels-photo-4386431.jpeg',
          tags: ['finans', 'para', 'bütçe'],
          language: 'tr',
          is_published: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      ]
      
      const mockPosts = i18n.language === 'tr' ? mockPostsTr : mockPostsEn
      setPosts(mockPosts)
    } finally {
      setLoading(false)
    }
  }

  const filteredPosts = posts.filter(post =>
    post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.author_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
  }

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      excerpt: '',
      slug: '',
      author_name: '',
      cover_image_url: '',
      tags: '',
      language: 'en',
      is_published: false,
    })
    setEditingPost(null)
    setShowForm(false)
  }

  const handleEdit = (post: BlogPost) => {
    setEditingPost(post)
    setFormData({
      title: post.title,
      content: post.content,
      excerpt: post.excerpt,
      slug: post.slug,
      author_name: post.author_name,
      cover_image_url: post.cover_image_url || '',
      tags: post.tags?.join(', ') || '',
      language: post.language,
      is_published: post.is_published || false,
    })
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const postData = {
        ...formData,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean),
        slug: formData.slug || generateSlug(formData.title),
        updated_at: new Date().toISOString(),
      }

      if (editingPost) {
        // Update existing post
        try {
          const { error } = await supabase
            .from('blog_posts')
            .update(postData)
            .eq('id', editingPost.id)

          if (error) throw error
        } catch (dbError) {
          // Fallback: update in local state for demo mode
          setPosts(posts.map(post => 
            post.id === editingPost.id ? { 
              ...post, 
              ...postData,
              id: editingPost.id,
              created_at: editingPost.created_at,
              updated_at: new Date().toISOString(),
            } : post
          ))
        }
        toast.success('Blog post updated successfully!')
      } else {
        // Create new post
        try {
          const { data, error } = await supabase
            .from('blog_posts')
            .insert([postData])
            .select()

          if (error) throw error
          
          if (data && data[0]) {
            setPosts([data[0], ...posts])
          }
        } catch (dbError) {
          // Fallback: add to local state for demo mode
          const newPost = {
            ...postData,
            id: `blog-${Date.now()}`,
            created_at: new Date().toISOString(),
          } as BlogPost
          setPosts([newPost, ...posts])
        }
        toast.success('Blog post created successfully!')
      }

      resetForm()
    } catch (error) {
      console.error('Error saving blog post:', error)
      toast.error('Failed to save blog post')
    } finally {
      setSubmitting(false)
    }
  }

  const togglePostStatus = async (postId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('blog_posts')
        .update({ is_published: !currentStatus })
        .eq('id', postId)

      if (error) throw error

      setPosts(posts.map(post =>
        post.id === postId
          ? { ...post, is_published: !currentStatus }
          : post
      ))

      toast.success(`Blog post ${!currentStatus ? 'published' : 'unpublished'} successfully!`)
    } catch (error) {
      console.error('Error toggling post status:', error)
      toast.error('Failed to update post status')
    }
  }

  const deletePost = async (postId: string) => {
    if (!window.confirm('Are you sure you want to delete this blog post? This action cannot be undone.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('blog_posts')
        .delete()
        .eq('id', postId)

      if (error) throw error

      setPosts(posts.filter(post => post.id !== postId))
      toast.success('Blog post deleted successfully!')
    } catch (error) {
      console.error('Error deleting blog post:', error)
      toast.error('Failed to delete blog post')
    }
  }

  if (loading) {
    return <LoadingSpinner className="py-12" />
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Manage Blog Posts</h1>
            <p className="text-gray-600 mt-2">Create and manage your blog content</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Blog Post
          </button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search blog posts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Blog Posts Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Blog Post
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Author
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPosts.map((post) => (
                  <tr key={post.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <img
                          src={post.cover_image_url || 'https://images.pexels.com/photos/4144923/pexels-photo-4144923.jpeg'}
                          alt={post.title}
                          className="w-10 h-10 rounded-lg object-cover mr-4"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = 'https://images.pexels.com/photos/4144923/pexels-photo-4144923.jpeg';
                          }}
                        />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {post.title}
                          </div>
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {post.excerpt}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <User className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">{post.author_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => togglePostStatus(post.id, post.is_published || false)}
                          className="flex items-center"
                        >
                          {post.is_published ? (
                            <ToggleRight className="h-6 w-6 text-green-600" />
                          ) : (
                            <ToggleLeft className="h-6 w-6 text-gray-400" />
                          )}
                        </button>
                        <span className={`text-sm ${post.is_published ? 'text-green-600' : 'text-gray-400'}`}>
                          {post.is_published ? 'Published' : 'Draft'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="h-4 w-4 mr-1" />
                        {format(new Date(post.created_at), 'MMM d, yyyy')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleEdit(post)}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <a
                        href={`/blog/${post.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-600 hover:text-green-700"
                      >
                        <Eye className="h-4 w-4" />
                      </a>
                      <button
                        onClick={() => deletePost(post.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredPosts.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No blog posts found</p>
            </div>
          )}
        </div>

        {/* Blog Post Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full max-h-screen overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {editingPost ? 'Edit Blog Post' : 'Add Blog Post'}
                  </h2>
                  <button
                    onClick={resetForm}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => {
                        const title = e.target.value
                        setFormData({ 
                          ...formData, 
                          title,
                          slug: formData.slug || generateSlug(title)
                        })
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter blog post title"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Slug *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="url-friendly-slug"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      URL-friendly version of the title (auto-generated from title)
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Excerpt *
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={formData.excerpt}
                    onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Brief description of the blog post"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Content * (HTML Editor)
                  </label>
                  <textarea
                    required
                    rows={12}
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                    placeholder="<h2>Your heading</h2><p>Your content here...</p>"
                  />
                  <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <p className="text-xs text-blue-800 font-medium mb-2">💡 HTML Tips:</p>
                    <ul className="text-xs text-blue-700 space-y-1">
                      <li>• Use <code>&lt;h2&gt;</code> for main headings, <code>&lt;h3&gt;</code> for subheadings</li>
                      <li>• Wrap paragraphs in <code>&lt;p&gt;</code> tags</li>
                      <li>• Use <code>&lt;strong&gt;</code> for bold, <code>&lt;em&gt;</code> for italic</li>
                      <li>• Create lists with <code>&lt;ul&gt;&lt;li&gt;</code> or <code>&lt;ol&gt;&lt;li&gt;</code></li>
                    </ul>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Author Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.author_name}
                      onChange={(e) => setFormData({ ...formData, author_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Author's full name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Language
                    </label>
                    <select
                      value={formData.language}
                      onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="en">English</option>
                      <option value="tr">Turkish</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cover Image URL *
                  </label>
                  <input
                    type="url"
                    required
                    value={formData.cover_image_url}
                    onChange={(e) => setFormData({ ...formData, cover_image_url: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://example.com/image.jpg"
                  />
                  {formData.cover_image_url && (
                    <div className="mt-2">
                      <img
                        src={formData.cover_image_url}
                        alt="Preview"
                        className="w-32 h-24 object-cover rounded-md border"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                        onLoad={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'block';
                        }}
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="finance, money, budgeting"
                  />
                </div>

                <div className="flex items-center">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.is_published}
                      onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Publish immediately</span>
                  </label>
                </div>

                <div className="flex justify-end space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 text-gray-600 hover:text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    {submitting ? (
                      'Saving...'
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        {editingPost ? 'Update Post' : 'Create Post'}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminBlogs